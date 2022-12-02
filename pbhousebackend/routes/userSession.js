const router = require('express').Router()
let userSession = require('../schemas/userSession.schema')
let User = require('../schemas/user.schema')
const os = require('os');


router.route('/find/?').get(async(req, res)=>{
try{
     let response = await userSession.findOne(req.query).and({isDeleted:false})
     res.json(response)

    }catch(err)
    {
        console.log(err)
        res.status(400).json('Error' + err)
    }
})

router.route('/findall').get(async(req, res)=>{
    try{
    let response, myRes
    if(req.query.myToken && req.query.myId)
        myRes = await userSession.findOne({token:req.query.myToken, _id:req.query.myId}).and({isDeleted:false})
    if(myRes)
       response = await userSession.find()
        res.json(response)
        }catch(err)
        {
            res.status(400).json('Error' + err)
        }
    })
router.route('/findsessions').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let response, myRes
        if(req.query.myToken && req.query.myId)
            myRes = await userSession.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
        {
            delete query.myToken
            delete query.myId
          response=await  userSession.find(query).sort({createdAt:-1})
        }
        res.json(response)

    }catch(err)
    {
        res.status(400).json(err)
    }

})
// const getDevice =async ()=>{
//     try{
//     const cpu=  os.cpus()
//     const platform = os.platform()
//     const osType = os.type()
//     const network = os.networkInterfaces()
//     let firstObject = Object.values(network)[0]
//     if (firstObject.length>1)
//         firstObject =firstObject[1]
//     else
//         firstObject=firstObject[0]
//     const homeDir=os.homedir()
//     const hostName = os.hostname()
//     const userInfo = os.userInfo()
//    return {mac:firstObject, cpu:cpu[0].model, platform:platform, osType:osType, dir:homeDir, hostName:hostName, userInfo:userInfo.username}
//     }catch(err)
//     {
//        return null
//     }
// }

router.route('/getmac').get(async(req, res)=>{
    try{
        //     macaddress.all(function (err, all) {
        //         console.log(JSON.stringify(all, null, 2))
        //     res.json(JSON.stringify(all, null, 2));
        //   });
        // const cpu=  os.cpus()
        // const platform = os.platform()
        // const osType = os.type()
        // const network = os.networkInterfaces()
        // console.log(network)
        // let firstObject = Object.values(network)[0]
        // if (firstObject.length>1)
        //     firstObject =firstObject[1]
        // else
        //     firstObject=firstObject[0]
        // const homeDir=os.homedir()
        // const hostName = os.hostname()
        // const userInfo = os.userInfo()
        // res.json({mac:network, cpu:cpu[0].model, platform:platform, osType:osType, dir:homeDir, hostName:hostName, userInfo:userInfo.username})
        }catch(err)
        {
            console.log(err)
            res.status(400).json('Error' + err)
        }
    
    })

router.route('/authenticate/?').get(async (req, res)=>{
    try{
        var user;
    if(req.query.username){
            user = await User.findOne({username:req.query.username})  }
    else
            user = await User.findOne({_id:req.query._id})
     if(user){
        const authenticated= user.validPassword(req.query.password) 

      if(authenticated)
      {
        if(user.status!=='ACTIVE')
        {
            res.json({user:user.username, status:user.status})
        }
        else
        {
            const activeSession = await userSession.findOne({token:user._id}).and({isDeleted:false})
            if(activeSession)
            res.json({session:activeSession, new:false}) 
            else
                {
                    const isDeleted= false
                    const username= user.username
                    const description = 'hello'
                    const duration = 6
                    const date = new Date()
                    const token = user._id
                    const newSession = new userSession({ isDeleted,  username, description,  duration, date, token})
                    const resp = await newSession.save()
                    res.json({session:resp, new:true}) 
                }
        }

      }
      else res.json(false)
    }
    else res.json(false)

  }catch(err){
    console.log(err)
    res.json(false)
     }
  })

  router.route('/verifypass').get(async (req, res)=>{
    try{

        var user;
    if(req.query.username){
            user = await User.findOne({username:req.query.username})  }
    else
            user = await User.findOne({_id:req.query._id})
     if(user){
        const authenticated= user.validPassword(req.query.password) 
      if(authenticated)
      {
        res.json(true)
      }        
      else res.json(false)
    }
    else res.json(false)

  }catch(err){
    res.json(false)
     }
  })


router.route('/logout').put(async(req, res)=>{
    try{
        let query = req.body
        let myResp
        if(query.myToken && query.myId)
            myResp = await userSession.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if (myResp)
        {
            const data = await userSession.findByIdAndUpdate(query.myId, {isDeleted:true})
            res.json({loggedout:'success'})
        }
        else
            res.json(null)
      
    }catch(err){
        console.log(err.message)
        res.json(null)
    }
})

router.route('/logoutbyid').put(async(req, res)=>{
    try{
        
        let query = req.body
        let myResp
        if(query.myToken && query.myId)
            myResp = await userSession.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if (myResp)
        {
            const options = {useFindAndModify: false}
            const data = await userSession.findOneAndUpdate({_id:query.token, isDeleted:false}, {isDeleted:true}, options)
            if(data)
            res.json({loggedout:'success'})
            else  
                res.json(null)
        }
        else
            res.json (null)
    }catch(err){
        console.log(err.message)
        res.json(null)
    }
})

router.route('/delete').put(async (req, res)=>{
    try{
        let query = req.body
        let myResp, resp
        if(query.myToken && query.myId)
            myResp = await userSession.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myResp)
        {
            delete query.myToken, 
            delete query.myId
            resp = await userSession.findByIdAndDelete(query._id)
        }
        if(resp)
        res.json({message:'success', id:resp._id})
        else
            res.json(null)
    }catch(err)
    {
        res.json(null)
    }
})


router.route('/update/:id').put((req,res)=>{
    userSession.findById(req.params.id)
    .then(exercise =>{
        exercise.username = req.body.username
        exercise.description = req.body.description
        exercise.duration = Number(req.body.duration)
        exercise.date = Date.parse(req.body.date)
    
        exercise.save()
        .then(()=>res.json('Exercise updated!'))
        .catch(err => res.status(400).json('Error: ' + err))
    })
    .catch(err => res.status(400).json('Error: +' + err))
})

router.route('/setonline/?').put(async(req,res)=>{
    
    try
    {
        const resp = await userSession.findByIdAndUpdate(req.body.id, {date:new Date()})
        res.json(resp)

    }catch(err)
    {
        res.status(400).json(err)
    }
})

module.exports = router