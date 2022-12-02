const router = require('express').Router();
let Supplier = require('../schemas/supplier.schema');
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
                const name = req.body.name
                const type = req.body.type
                const address = req.body.address
                const contactNo = req.body.contactNo
                const desc= req.body.desc
                const isDeleted = false
                const addedBy=req.body.addedBy ? req.body.addedBy : 'MISC'
                let id=1
                const lastSupplier =await  Supplier.findOne().sort({"id":-1})
                if(lastSupplier)
                id = lastSupplier.id+1
                const newSupplier = new Supplier(
                    {id, name, type, address, contactNo, desc, isDeleted, addedBy}
                    )
                 await newSupplier.save()
                 res.json('Data Added')
            }
            else
                res.json(null)

       
       
    }catch(err){
        res.status(401).json("ERROR: " + err)
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
                    const id = req.body.id
                    if(req.body.name)
                    {
                        
                        const name = req.body.name.trim()
                        const type = req.body.type
                        const address = req.body.address
                        const contactNo = req.body.contactNo
                        const desc= req.body.desc
        
                            resp = await Supplier.findByIdAndUpdate(req.body._id, {
                                name:name, type:type, address:address, contactNo:contactNo,
                                desc:desc, id:id,
                            })              
                    }
                    else if(req.body.isDeleted !== undefined )
                    {
                        const deleted= req.body.isDeleted
                        resp = await Supplier.findByIdAndUpdate(req.body._id, {isDeleted:deleted})
                    }
             
                    res.json(resp)
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
    

router.route('/findone').get(async(req, res)=>{
    try{
        let query = req.query
    let response, myRes
    if(query.myToken && query.myId)
        myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
    if(myRes)
        {   
            delete query.myToken
            delete query.myId
            if(req.query.name)
            {
                response =await Supplier.findOne( {"name":{ '$regex' : `^${query.name}$`, '$options' : 'i' }})
                res.json(!myRes ? null: response ? false :true )
            }
            else
            {
                response =  await Supplier.findOne(query)
                res.json(response)
            }
        }
      
    
    }catch(err)
    {
        return err
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
                if(Object.keys(query).length)
                {
                    const objName = Object.keys(query)[0]
                    let wordsArray=undefined
                    let queryArray=[]
                    if(objName ==='id')
                    {
                        resp =[]
                        if(isNaN(req.query.id) )
                        {
                        var ObjectId = require('mongoose').Types.ObjectId;
                          if( ObjectId.isValid(req.query.id))
                          {      
                            const response = await Supplier.findById(req.query.id.trim())
                            if (response)
                                resp.push(response)
                          }
                        }
                        else
                           resp=await Supplier.find({id:req.query.id}).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({id:-1})
                           res.json(resp)
                    }
                    else if(objName ==='isDeleted')
                    {
                        resp=await Supplier.find({isDeleted:true}).sort({id:-1})
                           res.json(resp)
                    }
                    else
                    {
                        if (typeof query[Object.keys(query)[0]] !== 'boolean' && objName !== '_id')
                        {
                            query[objName]= query[objName]
                            wordsArray = query[objName].split(' ')
                            wordsArray.map(word=>
                                queryArray.push({[objName]:{"$regex":word, "$options": "i"}}) 
                            )
        
                            delete query[objName]
                        }
                        if(queryArray.length)
                            resp = await Supplier.find(query).and(queryArray).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({id:-1})
                        else
                            resp= await Supplier.find().and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({id:1}).sort({id:-1})
                        
                        res.json(resp)
                    }
                }
                else
                {
                    resp = await Supplier.find().and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({id:1}).sort({id:-1})
                    res.json(resp)
                }
    
            }
            else
                res.json(null)
  

    }catch(err)
    {
        res.json(null)
    }
})

module.exports= router