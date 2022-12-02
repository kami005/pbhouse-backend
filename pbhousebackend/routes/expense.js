const router = require('express').Router();
let Expense = require('../schemas/expense.schema');
let Session = require('../schemas/userSession.schema')

router.route('/add').post( async(req, res)=>{
    try{
        const cat = req.body.cat
        const title = req.body.title.trim()
        const amount = req.body.amount
        const addedBy = req.body.addedBy
        const status= req.body.status
        const supplier = req.body.supplier
        const purchaseID = req.body.purchaseID
        const  items=req.body.items ? req.body.items :[], purchases=req.body.purchases? req.body.purchases:[]
        let date = req.body.date
        if (date ==='')
            date= new Date()
        const isDeleted = false
        const newExpense = new Expense(
            {cat, title, amount, addedBy, status, isDeleted, date, supplier, purchaseID, items,purchases }
            )
        const resp= await newExpense.save()
              res.json(resp)
    }catch(err){
        console.log(err)
        res.status(401).json("ERROR: " + err)
    }
})

router.route('/update').put(async(req, res, next)=>{
    try
    {
      
            let id = req.body._id
            const expense = req.body.expense
            const resp = await Expense.findByIdAndUpdate(id, expense)
                if(resp)
                    res.json({_id:resp._id})
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
                const resp = await Expense.findByIdAndDelete(id)
                res.json(resp)
            }
    }
    catch(err)
        {
            console.log(err)
            res.json(null)
        }
})

router.route('/findexpenses').get(async(req, res, next)=>{
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
        let purchaseResp, otherResp
        let date= new Date(req.query.date)
        var newDate = new Date(req.query.date)

        date =new Date(date.getFullYear(), date.getMonth(), 1)

        if(date.getMonth()===12)
        newDate = new Date(date.getFullYear()+1, 1, 1);
        else
        newDate = new Date(date.getFullYear(), date.getMonth()+1, 1);
       
        purchaseResp = await Expense.aggregate( [
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
                                        {'cat':'PURCHASES'},
                                        {'cat':'PURCHASERETURN'}
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


            otherResp = await Expense.aggregate( [
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
                            {'cat':{'$ne':'PURCHASES'}},
                            {'cat':{'$ne':'PURCHASERETURN'}}
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
                            'purchaseID':'$purchaseID',
                            'id':'$_id',
                            'isDeleted':'$isDeleted',
                            'createdAt':'$createdAt',

                        }
                        }
                    }, 
                },
                
                {
                    $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                }
              ])

              
        res.json({purchases:purchaseResp, other:otherResp})
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
                        //filter by date
        let pendingExpense, pendingExpenses

        pendingExpenses = await Expense.aggregate( [
            {
                $match:
                {
                    
                    $and:
                    [
                        { 'isDeleted': {  '$ne': true}},
                        {'status': 'PENDING'},
                        {'cat':{'$ne':'PURCHASES'}},
                        {'cat':{'$ne':'PURCHASERETURN'}}
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
                        'purchaseID':'$purchaseID',
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

        pendingExpense= await Expense.aggregate( [
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
                    payables:{$sum:  "$amount"} ,
                  }, 
                },
              ])

        let payableAmount=0
          if(pendingExpense && pendingExpense.length && pendingExpense[0]._id)
          payableAmount = pendingExpense[0].payables
              
        res.json({payableAmount, other:pendingExpenses})
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
                let skip=0, limit=50
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
                const resp = await Expense.find(query).sort({createdAt:-1}).limit(limit).skip(skip)
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

router.route('/findpurchasereport').get(async(req, res, next)=>{
    try
    {
        let query = {...req.query}
        let  myRes
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {
                delete query.myToken
                delete query.myId
            const resp = await Expense.find().or([{purchases: {$elemMatch: {purchaseID:parseInt(query.purchaseID)}}}, {title:`FromBillID:${query.purchaseID}`}]).sort({createdAt:-1})
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
                const otherExpense = await Expense.aggregate( [
                    {
                        $match:
                        { 
                            $and:
                            [
                                { createdAt:{$gte: startDate, $lt: endDate}},
                                { 'isDeleted': {  '$ne': true}},
                                {'status': {'$ne': 'PENDING'}},
                                {'cat':{'$ne':'PURCHASES'}},
                                {'cat':{'$ne':'PURCHASERETURN'}}
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

                  const purchaseExpense = await Expense.aggregate( [
                    {
                        $match:
                        { 
                            $and:
                            [
                                { createdAt:{$gte: startDate, $lt: endDate}},
                                { 'isDeleted': {  '$ne': true}},
                                {
                                    $or:[
                                        {'cat':'PURCHASES'},
                                        {'cat':'PURCHASERETURN'}
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

                  let otherTotal =0, purchaseTotal=0
                  for (let i in otherExpense)
                  {
                    otherTotal+=otherExpense[i].total
                  }
                  for (let i in purchaseExpense)
                  {
                    purchaseTotal +=purchaseExpense[i].total
                  }
                res.json({otherExpense:otherTotal, purchaseExpense:purchaseTotal})
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