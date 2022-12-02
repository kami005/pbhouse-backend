const router = require('express').Router()
let User = require('../schemas/user.schema')
let Session = require('../schemas/userSession.schema')

router.route('/find').get(async(req, res, next)=>{
try
{
    let query = req.query
    let response, myRes
    if(query.myToken && query.myId)
        myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
    if(myRes)
        {   
            delete query.myToken
            delete query.myId
            response=await  User.findOne(query) 
        }
        res.json(!myRes ? null: response ? false :true )
}catch(err)
{
    res.status(400).json(err)
}
})

router.route('/findData/?').get(async (req, res, next)=>{
    try{
        let query = req.query
        let response, myRes
        if(query._id && query.myId)
            myRes = await Session.findOne({token:query._id, _id:query.myId})
        if(myRes)
            {   
                delete query.myId
             const user = await User.findById(req.query._id)
             response={username: user.username, _id:user._id, userType:user.userType, status:user.status, rights:user.rights, fName:user.fName, lName:user.lName, email:user.email, address:user.address }
            }
    
        res.json(response)
    }catch (err){
        res.json(null)
    }
})


router.route('/findall').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let response, myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                if (query._id)
                {
                    response = await User.findById(query._id)
                    if(response)
                        response=[response]
                }
                else if (query.username)
                {
                    response = await User.findOne({username:query.username})
                    if(response)
                        response=[response]
                }
                else if (Object.keys(query).length===0){
                     response = await User.find(query).sort({createdAt:-1})
                  }
                  else
                  {
                    const objName = Object.keys(req.query)[0]
                    let wordsArray= query[objName].split(' ')
                    var queryArray=[]
                    wordsArray.map(word=>
                        queryArray.push({[objName]:{"$regex":word,  "$options": "i"}})
                    )
                  if(query.length===1){
                    response = await  User.find().or(queryArray)
                  }
                  else{
                      delete query[objName]
                      response=await  User.find(query).or(queryArray)
                  }
                  }
            }
            res.json(response)
    
    }catch(er)
    {
        res.status(400).json(er)
    }
})

router.route('/add').post(async(req, res, next)=>{
    try
    {
        let query = req.body
        let myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
    
                const username = req.body.username.trim().toLowerCase()
                const fName = req.body.fName
                const lName = req.body.lName
                const address = req.body.address
                const password = req.body.password
                const email= req.body.email
                const status=req.body.status
                const userType=req.body.userType
                const rights = req.body.rights ? req.body.rights:[]
                const newUser = new User({username, fName, lName, address, password, email, status, userType, rights})
                newUser.password=newUser.generateHash(password)
                const res = await newUser.save()
                if(res)
                res.json('User added!')
                else
                res.json(null)
            }
    }catch(err)
    {
        res.status(400).json(err)
    }


    
})


router.route('/update').put(async (req, res, next)=>{
   
    try
    {
        let query = req.body
        let myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                const id = req.body._id
                const username = req.body.username
                const fName = req.body.fName
                const lName = req.body.lName
                const address = req.body.address
                const email= req.body.email
                const status = req.body.status
                const rights = req.body.rights ? req.body.rights:null
                let userType
                if(req.body.userType)
                 userType= req.body.userType
                if(userType)
                {
                    await User.findOneAndUpdate({_id:id}, {username, fName, lName, address, email, status, userType, ...(rights ? { rights } : {}) })
                    res.json('User updated!')
                }    
                else
                {
                    await User.findOneAndUpdate({_id:id}, {username, fName, lName, address, email, ...(rights ? { rights } : {})})
                    res.json('User updated!')
                }
            }

    }
    catch(err)
    {
        res.status(400).json('Error: '+err)
    }


})

router.route('/updatepass').post(async(req, res, next)=>{
                try
                {
                    let query = req.body
                    let myRes
                    if(query.myToken && query.myId)
                        myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
                    if(myRes)
                        {   
                            delete query.myToken
                            delete query.myId
                            const id = req.body._id
                            const updatedUser= new User({password:req.body.password})
                            const password = updatedUser.generateHash(req.body.password)
                            await  User.findOneAndUpdate({_id:id}, {password})
                            res.json('User updated!')  
                        }
                }catch(err)
                {
                    res.status(400).json('Error: '+err)
                }
})


router.route('/getdblist').get(async(req, res)=>{
    try
    {
        let query = req.query
        let myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                var mongoo =  require('mongoose')
                mongoo.connection.db.listCollections().toArray( function(err, names) {
                    if (err)
                            res.json([])
                    else 
                    {
                        let dbNames=[]
                        names.forEach(name=>dbNames.push(name.name))
                        res.json(dbNames)
                    }
                })

            }
            else
            res.json(null)
    
    }catch(er)
    {
        res.status(400).json(er)
    }
})



module.exports = router