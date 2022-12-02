const router = require('express').Router();
let Message = require('../schemas/message.schema');
let Session = require('../schemas/userSession.schema')

router.route('/add').post( async(req, res)=>{
    try{
        let  myRes, request=req.body
        if(request.myToken && request.myId)
            myRes = await Session.findOne({token:request.myToken, _id:request.myId})
        if(myRes)
            {   
                delete request.myToken
                delete request.myId
                const newMessage = new Message({...req.body})
                const resp= await newMessage.save()
                res.json(resp)
            }

       
    }catch(err){
        res.status(401).json("ERROR: " + err)
    }
})

router.route('/addTicket').post( async(req, res)=>{
    try{
        let  myRes, request = req.body
        if(request.name && request.email && request.phone && request.message)
        {
            const newMessage = new Message({senderID:'GUEST', receiverID:'OTHER', message:request.message, type:'GUEST',
             status:'SENT', otherInfo:{email:request.email, phone:request.phone, name:request.name}})
             myRes= await newMessage.save()
        }
        res.json(myRes)
    
    }catch(err){
        console.log(err)
        res.status(401).json("ERROR: " + err)
    }
})

router.route('/getTicketMessage').put( async(req, res)=>{
    try{
        let  myRes, request=req.body
        if(request.myToken && request.myId)
            myRes = await Session.findOne({token:request.myToken, _id:request.myId})
        if(myRes)
            {   
                delete request.myId
                delete request.myToken

                const messages = await Message.find({senderID:'GUEST', status:'SENT'})
                if(messages.length)
                await Message.updateMany({senderID:'GUEST', status:'SENT'}, {status:'RECEIVE'})
                res.json(messages)
            }
            else
             res.json(null)
    
    }catch(err){
        console.log(err)
        res.status(401).json("ERROR: " + err)
    }
})


router.route('/getsentmessages').put( async(req, res)=>{
    try{
        let  myRes, request=req.body
        if(request.myToken && request.myId)
            myRes = await Session.findOne({token:request.myToken, _id:request.myId})
        if(myRes)
            {   
                delete request.myId
                const messages = await Message.find({receiverID:request.myToken, status:'SENT'})
                if(messages.length)
                await Message.updateMany({receiverID:request.myToken, status:'SENT'}, {status:'RECEIVE'})
                res.json(messages)
            }

    }catch(err){
        res.status(401).json("ERROR: " + err)
    }
})

router.route('/getreceivemessages').put( async(req, res)=>{
    try{
        let  myRes, request=req.body
        if(request.myToken && request.myId)
            myRes = await Session.findOne({token:request.myToken, _id:request.myId})
        if(myRes)
            {   
                delete request.myId
                const messages = await Message.find({senderID:request.myToken, status:'RECEIVE'})
                if(messages.length)
                await Message.deleteMany({status:'RECEIVE', senderID:request.myToken})
                res.json(messages)
            }

    }catch(err){
        res.status(401).json("ERROR: " + err)
    }
})


module.exports= router