const router = require('express').Router();
let Purchase = require('../schemas/purchases.schema');
let Session = require('../schemas/userSession.schema')


router.route('/add').post(async (req, res)=>{
    try
    {
        
        const purchase = req.body
        let  myRes
        if(purchase.myToken && purchase.myId)
            myRes = await Session.findOne({token:purchase.myToken, _id:purchase.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete purchase.myToken
                delete purchase.myId

        const purchaseStatus=purchase.purchaseStatus, orders=purchase.orders, procuredBy=purchase.procuredBy,
        supplierInfo=purchase.supplierInfo, subTotal=purchase.subTotal, otherAmount= purchase.otherAmount, othterAmountTitle=purchase.othterAmountTitle ? purchase.othterAmountTitle :'None', gTotal= purchase.gTotal,
        paymentStatus=purchase.paymentStatus, paid=purchase.paid, supplierBill = purchase.supplierBill, desc = purchase.desc ? purchase.desc : null

        let purchaseID=1
        const lastPurchase =await  Purchase.findOne().sort({"purchaseID":-1})
       if(lastPurchase)
         purchaseID = lastPurchase.purchaseID+1

        const newPurchase = new Purchase({purchaseID, purchaseStatus, orders, procuredBy, supplierInfo, subTotal,
             otherAmount, othterAmountTitle, gTotal, paid, paymentStatus, supplierBill, desc
        })

        const resp=await newPurchase.save()
        
        res.json(resp)
    }
    else
        res.json(null)
    }
    catch(err)
    {
        console.log(err)
        res.json(err)
    }
})


router.route('/update').put(async(req, res, next)=>{
    try
    {
        const query = req.body
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                const id =query._id
       
                if(query.isDeleted!==undefined)
                {
                    const isDeleted= query.isDeleted
                    const resp = await Purchase.findByIdAndUpdate(id, {isDeleted:isDeleted})
                    if(resp)
                        res.json(true)
                    else
                        res.json(null)
                }
                else
                {
                    const purchase = query.purchase
                    const resp = await Purchase.findByIdAndUpdate(id, purchase)
                    if(resp)
                        res.json(resp)
                    else
                        res.json(null)
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
                let searchDates=[]
                let dates=[]
                let queryArray=[]
                let wordsArray=undefined
                let Limit =50,  skip = 0
                if(query.limit)
                {
                    Limit=query.limit
                    delete query.limit
                }
                if(query.skip)
                {
                    skip=query.skip
                    delete query.skip
                }

                if(Object.keys(query)[0] ==='purchaseID')
                {
                    resp =[]
                    if(isNaN(req.query.purchaseID) )
                    {
                    var ObjectId = require('mongoose').Types.ObjectId;
                      if( ObjectId.isValid(req.query.purchaseID))
                      {      
                        const response = await Purchase.findById(req.query.purchaseID.trim())
                        if (response)
                            resp.push(response)
                      }
                    }
                    else
                    resp = await Purchase.find(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]})
                }
               else if(!query.dates)
                {
                     if (Object.keys(query)[0] ==='orders.itemName')
                    {
                        resp = await Purchase.find().and([{orders: {$elemMatch: {itemName:{'$regex':query['orders.itemName'], '$options':'i'}} }},{'isDeleted':{'$ne':true}}]).sort({purchaseID:-1})
                    }
                    else if (Object.keys(query)[0] ==='orders._id')
                    {
                        resp = await Purchase.find().and([{orders: {$elemMatch: {_id:query['orders._id'] }}},{'isDeleted':{'$ne':true}}]).sort({purchaseID:-1})
                    }
                    else if(Object.keys(query)[1]==='$or')
                    {
                        query[Object.keys(query)[1]][0] = JSON.parse(query[Object.keys(query)[1]][0])
                        query[Object.keys(query)[1]][1] = JSON.parse(query[Object.keys(query)[1]][1])
                        resp = await Purchase.find(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({purchaseID:-1})
                    }
                    else if(Object.keys(query)[0]==='supplierInfo.id')
                    {
                        resp = await Purchase.find(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).limit(Limit).skip(skip).sort({purchaseID:-1})
                    }
                   else if(query[Object.keys(query)[0]].length)
                    {
                        const objName = Object.keys(query)[0]
        
                        if (typeof query[Object.keys(query)[0]] !== 'boolean' && objName !== '_id')
                        {
                            query[objName]= query[objName].trim()
                            wordsArray = query[objName].split(' ')
                            wordsArray.map(word=>
                                queryArray.push({[objName]:{"$regex":word, "$options": "i"}}) 
                            )
        
                            delete query[objName]
                        }
                        resp = await Purchase.find({'isDeleted':{'$ne':true}}).or(queryArray).sort({purchaseID:-1})
                    }
                    else
                    {
                        // let date= new Date()
                        // var newDate = new Date()
                        // date =new Date(date.getFullYear(), date.getMonth(), 1)
                        // newDate = new Date(date.getFullYear(), date.getMonth()+1, 1);
                        resp = await Purchase.find({'isDeleted':{'$ne':true}}).sort({purchaseID:-1}).limit(Limit).skip(skip)
                    }
               
                }
                else
                {
                    dates = query.dates
                    const createdAt = {"createdAt":{
                        $gte: dates[0],
                        $lte: dates[1],
                    }}
        
                    delete query.searchByDates
                    delete query.dates
                    searchDates.push({...createdAt})
                    const objName = Object.keys(query)[0]

                    if (Object.keys(query)[0] ==='orders.itemName')
                    {

                        resp = await Purchase.find().and([{orders: {$elemMatch: {itemName:{'$regex':query['orders.itemName'], '$options':'i'}} }},{'isDeleted':{'$ne':true}}, {...createdAt}]).sort({purchaseID:-1})
                    }
                    else if(Object.keys(query)[1]==='$or')
                    {
                        query[Object.keys(query)[1]][0] = JSON.parse(query[Object.keys(query)[1]][0])
                        query[Object.keys(query)[1]][1] = JSON.parse(query[Object.keys(query)[1]][1])
                        resp = await Purchase.find(query).and([{$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}, {...createdAt}]).sort({purchaseID:-1})
                    }
                    else if(query[Object.keys(query)[0]].length)
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
                        resp = await Purchase.find({'isDeleted':{'$ne':true}}).or(queryArray).and(searchDates).sort({purchaseID:-1})
                    }
                    else
                    {
                        resp = await Purchase.find({'isDeleted':{'$ne':true}}).and(searchDates).sort({purchaseID:-1})
                    }
            }
            res.json(resp)
        }
            else
                res.json(null)
    }
    catch(err){
        console.log(err)
        res.json(null)
    }
})

router.route('/findone').get(async(req, res)=>{
    try{
        let query = req.query
        if(query.purchaseID)
         query.purchaseID=parseInt(query.purchaseID)
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
           const resp = await Purchase.findOne(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]})
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

router.route('/finddeletedbill').get(async(req, res)=>{
    try{
           const resp = await Purchase.find({isDeleted:true})
           res.json(resp)

    }catch(err)
    {   
        console.log(err)
        res.json(null)
    }
})


router.route('/getgraphs').get(async(req, res)=>{
    try{
        let prices
 
                prices = await Purchase.aggregate( [
                    {
                        $match:
                        {
                            $and:
                            [
                            { $or:[
                                {
                                    'isDeleted':undefined
                                },
                                {
                                    'isDeleted':false
                                },
                            ]
                                
                                
                            }
                            ]  
                        }
                },
                    { 
                      $group:
                        {
                          _id: {month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                          gTotal: { $sum:  "$gTotal"  },
                        }, 
                    },
                    
                    {
                        $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                    }
                  ]).limit(30)
                  let gTotal=[], dates=[]

                  for (let i=0;i<prices.length;i++){
                    let curMonth=0, lastMonth=0, difference =1, missingMonth=0
                    if(i>0 && prices[i]._id.year === prices[i-1]._id.year)
                    {
                        lastMonth = prices[i]._id.month
                        curMonth = prices[i-1]._id.month
                        difference = curMonth-lastMonth
                    }
                    else if(i>0 && prices[i-1]._id.year > prices[i]._id.year && (prices[i-1]._id.year - prices[i]._id.year === 1))
                    {
                        curMonth = prices[i-1]._id.month
                        lastMonth = prices[i]._id.month
                        difference = curMonth-lastMonth+12
                    }
                    else
                    {
                        difference=1 
                        curMonth=0
                        lastMonth=0
                    }
                    
                    if(i>0 && prices[i]._id.year === prices[i-1]._id.year)
                    {
                     
                        for(j=1;j<difference;difference--)
                        {
                            missingMonth=lastMonth+difference-1
                            gTotal.push(0)
                            dates.push(`${missingMonth}/${prices[i]._id.year}`)
                        } 
                    }
                      
                    else if(i>0 && prices[i-1]._id.year > prices[i]._id.year && (prices[i-1]._id.year - prices[i]._id.year === 1))
                    {
                        missingMonth=curMonth
                        let year = prices[i-1]._id.year
                       
                        for(j=1;j<difference;difference--)
                        {   
                            missingMonth--
                           
                            if(missingMonth===0)
                            {
                                missingMonth=12
                                year--
                            }  
                            if(missingMonth!==lastMonth)
                            {
                                gTotal.push(0)
                                dates.push(`${missingMonth}/${year}`)
                            }
   
                        }  
                    }

                    gTotal.push(prices[i].gTotal)
                    dates.push(`${prices[i]._id.month}/${prices[i]._id.year}`)
                }
    
            const purchaseGraphchart={gTotal, dates}
            res.json({purchaseGraphchart})

    }catch(err)
    {   
        console.log(err)
        res.json(null)
    }
})

router.route('/getpurchaseinfo').get(async(req, res)=>{
    try{

        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   

                
                let payable=[], recentPurchases=[],  pendingPurchases=[]
        
                 payable= await Purchase.aggregate([
                    { 
                        $match:
                                {
                                    $and:
                                    [   
                                        {'paymentStatus':{ '$ne':'PAID'}},
                                        { 'isDeleted': {  '$ne': true}},
                                        {'purchaseStatus':{'$ne':'RETURN'}}
                                    ]  
                                } 
                    },
                    { 
                        $group:
                          {
                            _id:  "$paymentStatus"   ,
                            gTotal: { $sum:  "$gTotal"  },
                            paid:{ $sum:  "$paid"}
                          }, 
                      },
                      
                      {
                          $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                      }
                    ])

                    pendingPurchases= await Purchase.find().and(
                        [
                            {'paymentStatus':{ '$ne':'PAID'}},
                            { 'isDeleted': {  '$ne': true}},
                            {'purchaseStatus':{'$ne':'RETURN'}}
                        ]
                    ).sort({'createdAt':1})

                recentPurchases= await Purchase.find().and(
                        [
                            { 'isDeleted': {  '$ne': true}},
                        ]
                    ).sort({'createdAt':-1}).limit(30)
        
                    for (let i in pendingPurchases)
                    {
                     const index = recentPurchases.findIndex(sale => sale.purchaseID=== pendingPurchases[i].purchaseID)
                     if(index<0)
                     recentPurchases.push(pendingPurchases[i])
                    }

                let payableAmount =0
        
                for (let i=0; i<payable.length; i++)
                    {
                        payableAmount+= payable[i].gTotal-payable[i].paid
                    }
               
                res.json({payableAmount, recentPurchases })
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

router.route('/deletepermanent').delete(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
            let id = req.query._id
             const resp = await Purchase.findByIdAndDelete(id)
             res.json(resp)
            }


    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})

module.exports= router