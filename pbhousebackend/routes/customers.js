const router = require('express').Router();
let Customer = require('../schemas/customer.schema');
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
                const customerName = req.body.customerName
                const customerType = req.body.customerType
                const address = req.body.addres
                const contactNo = req.body.contactNo
                const description= req.body.description
                const isDeleted = false
                const customerAddedBy=req.body.customerAddedBy ? req.body.customerAddedBy : 'MISC'
                let customerID=1
                const lastCustomer =await  Customer.findOne().sort({"customerID":-1})
               if(lastCustomer)
               customerID = lastCustomer.customerID+1
                const newCustomer = new Customer(
                    {customerID, customerName, customerType, address, contactNo, description, 
                    isDeleted, customerAddedBy}
                    )
                 await newCustomer.save()
               
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
                const id = req.body._id
                 if(req.body.customerName)
                {
                        const customerName = req.body.customerName
                        const customerType = req.body.customerType
                        const address = req.body.address
                        const contactNo = req.body.contactNo
                        const description= req.body.description
                        const customerID=req.body.customerID
    
                        resp = await Customer.findByIdAndUpdate(id, {
                            customerName:customerName, customerType:customerType, address:address, contactNo:contactNo,
                            description:description, customerID:customerID,
                        })              
                }
                else if(req.body.isDeleted !== undefined )
                {
                    const deleted= req.body.isDeleted
                    resp = await Customer.findByIdAndUpdate(id, {isDeleted:deleted})
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
        let  myRes, response
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                if(query.customerName)
                {
                    response =await Customer.findOne( {"customerName":{ '$regex' : `^${req.query.customerName}$`, '$options' : 'i' }}
                    );
                    res.json(!myRes ? null: response ? false :true )
                }
                else
                {
                     response =  await Customer.findOne(req.query)
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
                    if(objName ==='customerID')
                    {
                        resp =[]
                        if(isNaN(req.query.customerID) )
                        {
                        var ObjectId = require('mongoose').Types.ObjectId;
                          if( ObjectId.isValid(req.query.customerID))
                          {      
                            const response = await Customer.findById(req.query.customerID.trim())
                            if (response)
                                resp.push(response)
                          }
                        }
                        else
                           resp=await Customer.find({customerID:req.query.customerID}).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({customerID:-1})
                           res.json(resp)
                    }
                    else if(objName ==='isDeleted')
                    {
                        resp=await Customer.find({isDeleted:true}).sort({customerID:-1})
                           res.json(resp)
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
                            resp = await Customer.find(query).and(queryArray).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({customerID:-1})
                        else
                            resp= await Customer.find().and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({customerID:-1})
            
                        res.json(resp)
                    }
                }
                else
                {
                    resp = await Customer.find().and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({customerID:-1})
                    res.json(resp)
                }
            }

    }catch(err)
    {
        res.json(null)
    }
})

module.exports= router