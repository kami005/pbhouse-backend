const router = require('express').Router();
let Log = require('../schemas/log.schema');
let Session = require('../schemas/userSession.schema')

router.route('/add').post(async(req, res)=>{
    try{

        let query = req.body

        const newLog= new Log(query)
        const newItem =await newLog.save()
        res.json(newItem)

    }catch(err)
    {
        return err
    }
})

router.route('/update').put(async(req, res)=>{
    try{

       let query = req.body
       let id=query._id
       delete query._id 
       const resp =await Log.findByIdAndUpdate(id, query)    
       res.json(resp)
    }catch(err)
    {
        console.log(err)
        return err
    }
})

router.route('/delete').delete(async (req, res)=>{
    try{
        let id = req.query._id
      
        const resp = await Log.findByIdAndDelete(id)
        res.json(resp)

    }catch(err)
    {
        res.json(null)
    }
})

router.route('/findall').get(async(req, res)=>{
    try{
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   

                delete query.myToken
                delete query.myId
                let limit=50, skip=0
        
                if (query.limit)
                {
                    limit= query.limit
                    delete query.limit
                }
                if(query.skip)
                {
                    skip= query.skip
                    delete query.skip
                }
                 
                const resp =await Log.find().limit(limit).skip(skip).sort({createdAt:-1})
                res.json(resp)
        
            }
            else
                res.json(null)

    }catch(err)
    {
        res.json(null)
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
        let Limit=50, Skip=0
        let resp
        if(query.limit)
        {
            Limit=query.limit
            delete query.limit
        }
        if(query.skip)
        {
            Skip=query.skip
            delete query.skip
        }
         let queryArray=[]
        for (let i=0; i<Object.keys(query).length;i++)
        {
            if(Object.keys(query)[i] === '$or' || Object.keys(query)[i] === '$and')
            {
                let expArray=[]
                for(var j in query[Object.keys(query)[i]])
                {
                    if(isJsonString(query[Object.keys(query)[i]][j]))
                    expArray.push(JSON.parse(query[Object.keys(query)[i]][j]))
                }
                if(expArray.length)
                    queryArray.push({[Object.keys(query)[i]]:expArray})
            }
           else if(isJsonString(query[Object.keys(query)[i]]))
            queryArray.push({[Object.keys(query)[i]]: JSON.parse(query[Object.keys(query)[i]])})
            else
                {
                    queryArray.push({[Object.keys(query)[i]]: query[Object.keys(query)[i]]})
                }
        }
        if(queryArray.length)
         resp = await Log.find().and(queryArray).limit(Limit).skip(Skip).sort({createdAt:-1})
        else 
            resp = await Log.find().limit(Limit).skip(Skip).sort({createdAt:-1})
        res.json(resp)
    }catch(err)
    {
        console.log(err)
        res.json(null)
    }
})




module.exports= router
