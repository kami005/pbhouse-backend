const router = require('express').Router();
let Item = require('../schemas/items.schema');
let Session = require('../schemas/userSession.schema')
router.route('/add').post( async(req, res)=>{
    try{
        let query = req.body
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   

                delete query.myToken
                delete query.myId

                const itemName = req.body.itemName.trim()
                const sPrice = req.body.sPrice
                const pPrice = req.body.pPrice
                const stockOut = req.body.stockOut
                const type = req.body.type
                const model= req.body.model
                const vendor = req.body.vendor
                const desc=req.body.desc
                const itemAddedBy=req.body.itemAddedBy ? req.body.itemAddedBy : 'MISC'
                const qty=req.body.qty
        
                let itemID=1
                const lastItem =await Item.findOne().sort({itemID:-1})
               if(lastItem)
                itemID = lastItem.itemID+1
        
                const newItem = new Item(
                    {itemID, itemName, sPrice, pPrice, stockOut, type, model, vendor, desc, itemAddedBy, qty}
                    )
               
                await newItem.save()
                 res.json('Data Added')
            }
            else
            res.json(null)
 
    }catch(err){
        console.log(err)
        res.status(401).json("ERROR: " + err)
    }
    })

router.route('/findone').get(async(req, res)=>{
    try{
        let query = req.query
        let  myRes , response
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                if(req.query.itemName)
                {
                    response =await Item.findOne( {"itemName":{ '$regex' : `^${req.query.itemName}$`, '$options' : 'i' }});
                    res.json(!myRes ? null: response ? false :true )
                }
                else
                {
                     response =  await Item.findOne(req.query)
                    res.json(response)
                }
        
            }

    }catch(err)
    {
        return err
    }
})
router.route('/findstockworth').get(async(req, res)=>{
    try{

        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                let prices = await Item.aggregate( [
                    {
                            $match:
                            {
                                $and:
                                [
                                { 'isDeleted': {  '$ne': true}},
                                ]
                                     
                            }
                    },
                    {
                      $group:
                        {
                         _id: 1,
                        stockPurchase: { $sum:  {$multiply:["$pPrice", '$qty']}  },
                        stockSale: { $sum:  {$multiply:["$sPrice", '$qty']}  },
                        }, 
                    },
                  ])
                 
                  res.json(prices)
            }  
            else
            res.json(null)

     
    }catch(err)
    {
        console.log(err)
        return err
    }
})

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


router.route('/findbyquery').get(async(req, res)=>{
    try{
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                let resp=null
                let limit=50
                let skip=0
                if(query.skip)
                    skip = query.skip
                delete query.skip
                if(query.limit)
                limit = query.limit
                delete query.limit
                if(Object.keys(query)[0]==='$expr' && typeof query[Object.keys(query)[0]]==='string')
                {   
                    let queryArray=[]
                    for (let i=0; i<Object.keys(query).length;i++)
                    {
                    if (isJsonString(query[Object.keys(query)[i]]))
                        queryArray.push({[Object.keys(query)[i]]: JSON.parse(query[Object.keys(query)[i]])})
                    else
                        queryArray.push({[Object.keys(query)[i]]: query[Object.keys(query)[i]]})
                    }

                    resp = await Item.find().or(queryArray).and(
                    {$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).limit(limit).skip(skip).sort({itemID:-1})
                }
                else if(query[Object.keys(query)[0]].length)
                {
                    const objName = Object.keys(query)[0]
                    let wordsArray=undefined
                    let queryArray=[]
                    if(objName ==='id')
                    {   
                        resp=await Item.findById(req.query.id)
                    }
                    else if(objName ==='itemID')
                    {
                        resp =[]
                        if(isNaN(req.query.itemID) )
                        {
                        var ObjectId = require('mongoose').Types.ObjectId;
                          if( ObjectId.isValid(req.query.itemID))
                          {      
                            const response = await Item.findById(req.query.itemID.trim())
                            if (response)
                                resp.push(response)
                          }
                        }
                        else
                        resp=await Item.find({itemID:req.query.itemID}).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]})
                    }
                    else if(objName ==='isDeleted')
                    {
                        resp=await Item.find({isDeleted:true}).sort({itemID:-1})
                    }
                    else
                    {
                        if (typeof query[Object.keys(query)[0]] !== 'boolean' && objName !== '_id')
                        {
                            query[objName]= query[objName].trim()
                            wordsArray = query[objName].split(' ')
                            wordsArray.map(word=>
                                queryArray.push({[objName]:{"$regex":word, "$options": "i"}}) 
                            )
        
                            delete query[objName]
                        }
                        if(queryArray.length)
                            resp = await Item.find().and(queryArray).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({[objName]:1})
                        else    
                            resp= await Item.find().and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({itemID:-1})
                    }
                }
                else
                {
                    resp = await Item.find().and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({itemID:-1}).skip(skip).limit(limit)
                    
                }
                res.json(resp)
            }
            else
                res.json(null)


    }catch(err)
    {
        console.log(err)
        res.json(null)
    }
})

router.route('/searchbyquery').get(async(req, res)=>{
    try{
            let query =req.query
            let resp=null
            if(req.query.itemID && req.query.itemID !=='')
            {
                const id = parseInt(req.query.itemID)
                resp= await Item.find({itemID:id}).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({itemID:-1})
                res.json(resp)
            }
            else
            {
                if(Object.keys(query).length)
                {
                    const objName = Object.keys(query)[0]
                    let wordsArray=undefined
                    let queryArray=[]
    
                    if (typeof query[Object.keys(query)[0]] !== 'boolean' && objName !== '_id')
                    {
                        query[objName]= query[objName].trim()
                        wordsArray = query[objName].split(' ')
                        wordsArray.map(word=>
                            queryArray.push({[objName]:{"$regex":word, "$options": "i"}}) 
                        )
    
                        delete query[objName]
                    }
                    if(queryArray.length)
                        resp = await Item.find().and(queryArray).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).limit(15).sort({[objName]:1})
                    else
                        resp= await Item.find().limit(10).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({itemID:1})
                    res.json(resp)
                }
                else{
                    resp = await Item.find().limit(10).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({itemID:1})
                }
            }
    }catch(err)
    {
        res.json(null)
    }
})


router.route('/update').put(async(req, res, next)=>{
    try
    {
        let query = req.body
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId

                let resp = null
                const id = req.body._id
                if(req.body.isDeleted !== undefined && !req.body.itemName && !req.body.qty)
                {
                    const deleted= req.body.isDeleted
                          resp = await Item.findByIdAndUpdate(id, {isDeleted:deleted})
                    if(resp)
                        res.json(true)
                        else
                         res.json(null)
                }
                else
                {
                    if(req.body.itemName)
                    {
                        const ItemName = req.body.itemName.trim(), pPrice= req.body.pPrice, 
                        sPrice=req.body.sPrice, stockOut=req.body.stockOut, type=req.body.type, model=req.body.model,
                        desc=req.body.desc, vendor=req.body.vendor, qty=req.body.qty, itemID=req.body.itemID
            
                         resp = await Item.findByIdAndUpdate(id, {
                            itemName:ItemName, pPrice:pPrice, sPrice:sPrice, stockOut:stockOut, type:type, model:model,
                            desc:desc, vendor:vendor, qty:qty, itemID:itemID
                        })
                    }
                    else 
                    {
                        let qty= req.body.qty
                        resp = await Item.findOne({_id:id})
                        let curQty = resp.qty, curPrice= resp.pPrice
                       
                        if(req.body.type && req.body.type ==='SALE')
                       {
                        if(qty >curQty)
                            curQty=0
                        else
                            curQty -=qty
                            resp = await Item.findByIdAndUpdate(id, { qty:curQty})
                       }
                       else if(req.body.type && req.body.type ==='SALERETURN')
                       {
                      
                            curQty +=qty
                            resp = await Item.findByIdAndUpdate(id, { qty:curQty})
        
                       }
                       else
                       {
        
                        let avgPrice=0, newPrice=req.body.price
        
                        avgPrice= Math.round ((curPrice*curQty + qty*newPrice)/(curQty+qty))
        
        
                            curQty +=qty      
                            if(curQty<0)
                                curQty=0
                        
                                if(parseInt(avgPrice)<0)
                                    avgPrice *=-1
                                else if(isNaN(avgPrice))
                                    avgPrice=curPrice
                                if(isNaN(avgPrice))
                                            avgPrice=0
                        resp = await Item.findByIdAndUpdate(id, { qty:curQty, pPrice:avgPrice})
                       }
                       
                    }
                        res.json(resp)
                }

            }
            else
                res.json(null)

    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})


router.route('/delete').delete(async (req, res)=>{
    try{
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                const resp = await Item.findByIdAndDelete(query._id)
                res.json(resp)
            }
            else
                res.json(null)
    }catch(err)
    {
        res.json(null)
    }
})


module.exports= router
