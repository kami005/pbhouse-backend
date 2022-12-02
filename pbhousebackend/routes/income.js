const router = require('express').Router();
let Income = require('../schemas/income.shema');
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
                const request= req.body
                let date = req.body.date
        
                if (date ==='')
                    date= new Date()
                const isDeleted = false
                const newIncome = new Income(
                    {...request})
                const resp= await newIncome.save()
                 res.json(resp)
            }
            else
                res.json(null)

    }catch(err){
        console.log(err)
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

                let id = req.body._id
                const income = req.body.income
                const resp = await Income.findByIdAndUpdate(id, income)
                    if(resp)
                        res.json({_id:resp._id})
                        else
                         res.json(null) 
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

router.route('/delete/?').delete(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                let id = req.query._id
                const resp = await Income.findByIdAndDelete(id)
                res.json(resp)
            }
           
    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})

router.route('/findIncomes').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                        //filter by date
        let salesResp, otherResp
        let date= new Date(req.query.date)
        date =new Date(date.getFullYear(), date.getMonth(), 1)
        var newDate = new Date(req.query.date)
        if(date.getMonth()===12)
        newDate = new Date(date.getFullYear()+1, 1, 1)
        else
        newDate = new Date(date.getFullYear(), date.getMonth()+1, 1)
        salesResp = await Income.aggregate( [
                {
                    $match:
                    {
                        
                        $and:
                        [
                            {
                                createdAt:{
                                 $gte: date,
                                 $lt: newDate,
                                }
                             },
                            { 'isDeleted': {  '$ne': true}},
                            {'status': {'$ne': 'PENDING'}},
                            {
                                $or:[
                                        {'cat':'SALES'},
                                        {'cat':'SALERETURN'}
                                    ]
                            }
                      
                        ]  
                    }
            },
                { 
                  $group:
                    {
                      _id: { month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                      total: { $sum:  "$amount"  },
                    }, 
                },
                
                {
                    $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                }
              ])


            otherResp = await Income.aggregate( [
                {
                    $match:
                    {
                        
                        $and:
                        [
                            {
                                $or:[
                                    {
                                    date:{
                                        $gte: date,
                                        $lt: newDate,
                                       }
                                    },
                                    {
                                        $and:[
                                            { createdAt:{
                                                $gte: date,
                                                $lt: newDate,
                                               
                                            }
                                             }, {date:null}
                                        ]
                                   },
                                    
                                ]
                                
                         
                             },
                            { 'isDeleted': {  '$ne': true}},
                            {'status': {'$ne': 'PENDING'}},
                            {'cat':{'$ne':'SALES'}},
                            {'cat':{'$ne':'SALERETURN'}}
                        ]  
                    }
            },
                { 
                  $group:
                    {
                      _id:  "$cat"  ,
                      "data": {
                        $addToSet: {
                            "title": "$title",
                            "amount": '$amount',
                            'status':'$status',
                            'date':'$date',
                            'addedBy':'$addedBy',
                            'saleID':'$saleID',
                            'id':'$_id',
                            'isDeleted':'$isDeleted',
                            'createdAt':'$createdAt'
                        }
                        }
                    }, 
                },
                
                {
                    $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                }
              ])
        res.json({sales:salesResp, other:otherResp})

            }
            else
                re.json(null)

    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})



router.route('/findpending').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                let sumPendingIncome, pendingIncomes

                sumPendingIncome= await Income.aggregate( [
                        {
                            $match:
                            {
                                
                                $and:
                                [
                                    { 'isDeleted': {  '$ne': true}},
                                    {'status':'PENDING'}
                                ]  
                            }
                    },
                        { 
                          $group:
                            {
                              _id:'$status',
                              receiveable:{$sum:  "$amount"} ,
                            }, 
                        },
                ])
        
                 pendingIncomes = await Income.aggregate( [
                    {
                        $match:
                        {
                            $and:
                            [
                                {status: "PENDING"},
                                { 'isDeleted': {  '$ne': true}},
                                {'cat':{'$ne':'SALES'}},
                                {'cat':{'$ne':'SALERETURN'}}
                            ]  
                        }
                },
                    { 
                      $group:
                        {
                          _id:  "$cat"  ,
                          "data": {
                            $addToSet: {
                                "title": "$title",
                                "amount": '$amount',
                                'status':'$status',
                                'date':'$date',
                                'addedBy':'$addedBy',
                                'saleID':'$saleID',
                                'id':'$_id',
                                'isDeleted':'$isDeleted',
                                'createdAt':'$createdAt'
                            }
                            }
                        }, 
                    },
                  ])
        
                
                let receiveableAmount=0
                  if(sumPendingIncome && sumPendingIncome.length && sumPendingIncome[0]._id)
                  receiveableAmount = sumPendingIncome[0].receiveable
                res.json({receiveableAmount, other:pendingIncomes})
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

router.route('/findiwthquery').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                let skip =0, limit=50
                if(query.skip)
                {
                    skip=query.skip
                    delete query.skip
                }
                if(query.limit)
                {
                    limit=query.limit
                    delete query.limit
                 }
                
                if(query.createdAt && typeof query.createdAt === 'string')
                {
                    query = JSON.parse(query.createdAt)
                    query ={createdAt:query}
                    let otherquery = {...req.query}
                    delete otherquery.createdAt
                    if(otherquery.$or)
                    {
                        for (let i=0;i<otherquery.$or.length;i++)
                        {
                            otherquery.$or[i] = JSON.parse(otherquery.$or[i])
                        }
                        query={...query,...otherquery }
                    }
                
                }
                const resp = await Income.find(query).sort({createdAt:-1}).limit(limit).skip(skip)
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

router.route('/findsalereport').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                const resp = await Income.find().or([{sales: {$elemMatch: {saleID:parseInt(query.saleID)}}}, {title:`FromSALEID:${query.saleID}`}]).sort({createdAt:-1})
                res.json(resp)
            }else
                res.json(null)
     
    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})

router.route('/financialreport').get(async(req, res, next)=>{
    try
    {
        let query = req.query
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId

                let startDate = new Date(query.start), endDate =new Date(query.end)
                const otherIncome = await Income.aggregate( [
                    {
                        $match:
                        { 
                            $and:
                            [
                                { createdAt:{$gte: startDate, $lt: endDate}},
                                { 'isDeleted': {  '$ne': true}},
                                {'status': {'$ne': 'PENDING'}},
                                {'cat':{'$ne':'SALES'}},
                                {'cat':{'$ne':'SALERETURN'}}
                            ]  
                        }
                },
                    { 
                      $group:
                        {
                          _id:  "$cat"  ,
                          total: { $sum:  "$amount"  }
                        }, 
                    },
                    
                    {
                        $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                    }
                  ])

                  const salesIncome = await Income.aggregate( [
                    {
                        $match:
                        { 
                            $and:
                            [
                                { createdAt:{$gte: startDate, $lt: endDate}},
                                { 'isDeleted': {  '$ne': true}},
                                {
                                    $or:[
                                        {'cat':'SALES'},
                                        {'cat':'SALERETURN'}
                                    ]
                                }
                            
                            ]  
                        }
                },
                    { 
                      $group:
                        {
                          _id:  "$cat"  ,
                          total: { $sum:  "$amount"  }
                        }, 
                    },
                    
                    {
                        $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                    }
                  ])

                  let otherTotal =0, salesTotal=0
                  for (let i in otherIncome)
                  {
                    otherTotal+=otherIncome[i].total
                  }
                  for (let i in salesIncome)
                  {
                    salesTotal +=salesIncome[i].total
                  }
                res.json({otherIncome:otherTotal, salesIncome:salesTotal})
            }else
                res.json(null)
     
    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})

module.exports= router