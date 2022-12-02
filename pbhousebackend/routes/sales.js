const router = require('express').Router();
let Sale = require('../schemas/sales.schema');
let Session = require('../schemas/userSession.schema')

router.route('/add').post(async (req, res)=>{
    try
    {
        let sale = req.body
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete sale.myToken
                delete sale.myId
                
                const saleStatus=sale.saleStatus, orders=sale.orders, soldBy=sale.soldBy,
                customerInfo=sale.customerInfo, subTotal=sale.subTotal, discount=sale.discount,
                pAmount=sale.pAmount, otherAmount= sale.otherAmount, gst=sale.gst, gTotal= sale.gTotal,
                othterAmountTitle=sale.othterAmountTitle ? sale.othterAmountTitle :'None',
                paymentStatus=sale.paymentStatus, amountReceived=sale.amountReceived, desc= sale.desc ? sale.desc : null
                let saleID=1
                 const lastSale =await  Sale.findOne().sort({"saleID":-1})
                if(lastSale)
                    saleID = lastSale.saleID+1
                const newSale = new Sale({saleID,
                    saleStatus, orders, soldBy, customerInfo, subTotal, discount, pAmount, 
                    otherAmount, othterAmountTitle, gst, paymentStatus, gTotal, amountReceived, desc
                })
        
               const resp= await newSale.save()
                res.json(resp)
            }
            else
                res.json(null)

        
    }
    catch(err)
    {
        res.json(err)
    }
})

router.route('/findone').get(async(req, res)=>{
    try{
        let query = req.query
        let  myRes
        if(query.saleID && !isNaN(query.saleID))
        query.saleID=parseInt(query.saleID)
        if(query.myToken && query.myId)
            myRes = await Session.findOne({token:query.myToken, _id:query.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete query.myToken
                delete query.myId
                const resp = await Sale.findOne(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]})
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

router.route('/finddeletedsale').get(async(req, res)=>{
    try{
        let sale = req.query
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete sale.myToken
                delete sale.myId
             const resp = await Sale.find({isDeleted:true})
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
                 
                if(Object.keys(query)[0] ==='saleID')
                {
                    resp =[]
                    if(isNaN(req.query.saleID) )
                    {
                    var ObjectId = require('mongoose').Types.ObjectId;
                      if( ObjectId.isValid(req.query.saleID))
                      {      
                        const response = await Sale.findById(req.query.saleID.trim())
                        if (response)
                            resp.push(response)
                      }
                    }
                    else
                    resp = await Sale.find(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]})
                    res.json(resp)
                }
                else if(!query.dates)
                {
                     if (Object.keys(query)[0] ==='orders.itemName')
                    {
                        resp = await Sale.find().and(
                        [{orders: {$elemMatch: {itemName:{'$regex':query['orders.itemName'], '$options':'i'}} }},{'isDeleted':{'$ne':true}}]).sort({createdAt:-1})
                    }
                    else if (Object.keys(query)[0] ==='orders._id')
                    {
                        resp = await Sale.find().and([{orders: {$elemMatch: {_id:query['orders._id'] }}},{'isDeleted':{'$ne':true}}]).sort({saleID:-1})
                    }
                    else if(Object.keys(query)[1]==='$or')
                    {
                            query[Object.keys(query)[1]][0] = JSON.parse(query[Object.keys(query)[1]][0])
                            query[Object.keys(query)[1]][1] = JSON.parse(query[Object.keys(query)[1]][1])
                            resp = await Sale.find(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).sort({saleID:-1})
                    }
                    else if(Object.keys(query)[0]==='customerInfo.id')
                    {  

                        resp = await Sale.find(query).and({$or:[ {'isDeleted':undefined}, {'isDeleted':false} ]}).limit(Limit).skip(skip).sort({saleID:-1})
                    }
                   else if(query[Object.keys(query)[0]].length)
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
                        resp = await Sale.find({'isDeleted':{'$ne':true}}).or(queryArray).sort({saleID:-1})
                    }
                    else
                    {
                        // let date= new Date()
                        // var newDate = new Date()
                        // date =new Date(date.getFullYear(), date.getMonth(), 1)
                        // newDate = new Date(date.getFullYear(), date.getMonth()+1, 1);
                        resp = await Sale.find({'isDeleted':{'$ne':true}}).sort({saleID:-1}).limit(Limit).skip(skip)
                    }
                    res.json(resp)
                }
                else
                {
                    dates = query.dates
                    const createdAt = {
                        "createdAt":{
                        $gte: dates[0],
                        $lte: dates[1],
                    }}
    
                    delete query.searchByDates
                    delete query.dates

                    let queryArray=[]
                    searchDates.push({...createdAt})
                    const objName = Object.keys(query)[0]

                    if (Object.keys(query)[0] ==='orders.itemName')
                    {
                        resp = await Sale.find().and(
                        [{orders: {$elemMatch: {itemName:{'$regex':query['orders.itemName'], '$options':'i'}} }},{'isDeleted':{'$ne':true}}, {...createdAt}]).sort({saleID:-1})
                    }
                    else if(Object.keys(query)[1]==='$or')
                    {
                            query[Object.keys(query)[1]][0] = JSON.parse(query[Object.keys(query)[1]][0])
                            query[Object.keys(query)[1]][1] = JSON.parse(query[Object.keys(query)[1]][1])
                            resp = await Sale.find(query).and([{$or:[ {'isDeleted':undefined}, {'isDeleted':false}]},{...createdAt}]).sort({saleID:-1})
                    }
                    else if(query[Object.keys(query)[0]].length)
                    {
                        let wordsArray=undefined
                        if (typeof query[Object.keys(query)[0]] !== 'boolean' && objName !== '_id')
                        {
                            query[objName]= query[objName].trim()
                            wordsArray = query[objName].split(' ')
                            wordsArray.map(word=>
                                queryArray.push({[objName]:{"$regex":word, "$options": "i"}}) 
                            )
        
                            delete query[objName]
                        }
                        resp = await Sale.find({'isDeleted':{'$ne':true}}).or(queryArray).and(searchDates).sort({saleID:-1})
                    }
                    else
                    {
                        resp = await Sale.find({'isDeleted':{'$ne':true}}).and(searchDates).sort({saleID:-1})
                    }
                    res.json(resp)
                }
    
            }
            else
                res.json(null)

    }catch(err)
    {
        console.log(err)
        res.json(null)
    }
})


router.route('/update').put(async(req, res, next)=>{
    try
    {
        let sale = req.body
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete sale.myToken
                delete sale.myId
                let id = req.body._id
     
                if(req.body.isDeleted!==undefined)
                {
                    const isDeleted= req.body.isDeleted
                    const resp = await Sale.findByIdAndUpdate(id, {isDeleted:isDeleted})
                    if(resp)
                        res.json({saleID:resp.saleID})
                        else
                         res.json(null)
                }
                else
                {
                    const resp = await Sale.findByIdAndUpdate(id, {...sale, amountReceived:parseInt(sale.amountReceived)})
                        if(resp)
                            res.json({saleID:resp.saleID})
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
router.route('/deletepermanent').delete(async(req, res, next)=>{
    try
    {
        let sale = req.query
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                
                delete sale.myToken
                delete sale.myId
                let id = req.query._id
                const resp = await Sale.findByIdAndDelete(id)
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


function compare( a, b ) {

    if ( a.count < b.count ){
      return 1;
    }
    if ( a.count > b.count ){
      return -1;
    }
    return 0;
  }

router.route('/getgraphs').get(async(req, res, next)=>{
    try
    {

        let sale = req.query
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete sale.myToken
                delete sale.myId

        //Sale v Profit

    let prices
    if(req.query.fromDate && req.query.toDate)
    {
        const fromDate =new Date(req.query.fromDate), toDate=new Date(req.query.toDate)

        prices = await Sale.aggregate( [
        {
                $match:
                {
                    $and:
                    [
                    {
                        "createdAt": {
                            $gte: fromDate,
                            $lte: toDate,
                        }
                    },
                    { 'isDeleted': {  '$ne': true}},
                    ]
                         
                }
        },
        {
          $group:
            {
              _id: { day: { $dayOfMonth: "$createdAt"}, month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
              gTotal: { $sum:  "$gTotal"  },
              pAmount: { $sum:  "$pAmount"  },
              amountReceived: { $sum:  "$amountReceived"  },
            }, 
        },
        {
            $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
        }
      ]).limit(30)
    }
      else
        {

              prices = await Sale.aggregate( [
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
                      _id: { day: { $dayOfMonth: "$createdAt"}, month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                      gTotal: { $sum:  "$gTotal"  },
                      pAmount: { $sum:  "$pAmount"  },
                      amountReceived: { $sum:  "$amountReceived"  },
                    }, 
                },
                
                {
                    $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                }
              ]).limit(30)
        }


      let saleAmount=[], purchaseAmount=[], dates=[], profit=[], cashReceived=[]
      for (let i=0;i<prices.length;i++){
          saleAmount.push(prices[i].gTotal)
          let curProfit=prices[i].gTotal-prices[i].pAmount
          profit.push(curProfit)
          purchaseAmount.push(prices[i].pAmount)
          cashReceived.push(prices[i].amountReceived)
          dates.push(`${prices[i]._id.day}/${prices[i]._id.month}/${prices[i]._id.year}`)
        }

        const graphChart={saleAmount, purchaseAmount, dates, profit, cashReceived}

        //months sales

        prices = await Sale.aggregate( [
                    {
                        $match:
                        {
                            $and:
                            [   
                                { 'isDeleted': {  '$ne': true}},
                                {'saleStatus':{'$ne':'RETURN'}}
                            ]  
                        }
                    },
                    {
                      $group:
                        {
                          _id: {month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                          gTotal: { $sum:  "$gTotal"  },
                          pAmount: { $sum:  "$pAmount"  },
                        }, 
                    },
                    {
                        $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                    }
        ]).limit(12)
                  
        saleAmount =[], purchaseAmount=[], profit =[], dates=[]
               
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
                            saleAmount.push(0)
                            purchaseAmount.push(0)
                            profit.push(0)
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
                                saleAmount.push(0)
                                purchaseAmount.push(0)
                                profit.push(0)
                                dates.push(`${missingMonth}/${year}`)
                            }
   
                        }  
                    }

                    saleAmount.push(prices[i].gTotal)
                    let curProfit=prices[i].gTotal-prices[i].pAmount
                    profit.push(curProfit)
                    purchaseAmount.push(prices[i].pAmount)
                    dates.push(`${prices[i]._id.month}/${prices[i]._id.year}`)

                }
    
            const lineChart={saleAmount, purchaseAmount, profit, dates}


            //most sell vs least sell
            let resp=[]
            if(req.query.fromDate && req.query.toDate)
            {
                resp= await Sale.find().and(
                    [
                        {
                            createdAt:{
                             $gte: req.query.fromDate,
                             $lte: req.query.toDate,
                            },
                           
                         },
                         { 'isDeleted': {  '$ne': true}},
                     ]
                 )
    
    
            }
            else
            {
                let today= new Date()
                let priorDate = new Date().setDate(today.getDate()-30)
                priorDate = new Date(priorDate)
                resp = await Sale.find().and([
                 {"createdAt": {
                     $gte: priorDate,
                     $lte: today,
                 }
                },
                { 'isDeleted': {  '$ne': true}},
            ]
             )
              
            }

            let orderItems=[],  orderFreq=[], itemNames=[],  returnItemsName=[], returnFreq=[], returnItems=[]

            for(let i =0; i<resp.length; i++)
            {
                if(resp[i].saleStatus==='COMPLETE')
                 for(let j=0; j<resp[i].orders.length;j++)
                 {
                   
                   const index= orderItems.findIndex(item=>resp[i].orders[j].itemName===item.itemName)
                   if(index<0)
                   {
                    if(resp[i].orders[j].itemName.trim() !=='Teflon Tape' && resp[i].orders[j].itemName.trim() !=='Daga')
                        orderItems.push({itemName:resp[i].orders[j].itemName, count:1, status:resp[i].paymentStatus})
                   }
                   else
                   {
                        orderItems[index].count++
                   }
            
                 }
            }

            for(let i =0; i<resp.length; i++)
            {
                if(resp[i].saleStatus==='RETURN')
                 for(let j=0; j<resp[i].orders.length;j++)
                 {
                   
                   const index= returnItems.findIndex(item=>resp[i].orders[j].itemName===item.itemName)
                   if(index<0)
                   {
                    if(resp[i].orders[j].itemName.trim() !=='Teflon Tape' && resp[i].orders[j].itemName.trim() !=='Daga')
                            returnItems.push({itemName:resp[i].orders[j].itemName, count:1, status:resp[i].paymentStatus})
                   }
                   else
                   {
                        returnItems[index].count++
                   }
                        
                 }
            }

            const maximumItems=20
            orderItems.sort(compare)
            returnItems.sort(compare)
             for(let i=0;i<orderItems.length;i++)
                {
                    orderFreq.push(orderItems[i].count)
                    itemNames.push(orderItems[i].itemName)
                }
            for(let i=0;i<returnItems.length;i++)
                {
                    returnFreq.push(returnItems[i].count)
                    returnItemsName.push(returnItems[i].itemName)
                }
                
                orderFreq=orderFreq.slice(0,maximumItems)
                itemNames=itemNames.slice(0,maximumItems)

                returnFreq=returnFreq.slice(0,maximumItems)
                returnItemsName=returnItemsName.slice(0,maximumItems)

                const doughnutChart={itemNames, orderFreq}
                const pieChart ={returnItems:returnItemsName, returnFreq}
              
            res.json({lineChart, graphChart, doughnutChart, pieChart})
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


router.route('/getsales').get(async(req, res)=>{
    try{
        let sale = req.query
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete sale.myToken
                delete sale.myId
                const today = new Date(req.query.today)
                const tomorrow=new Date(req.query.tomorrow)
                let firstDay, lastDay
                if(req.query.today)
                {
                    firstDay= new Date(req.query.today)
                    lastDay= new Date(req.query.today)
                }
                 
                else
                {
                    firstDay = new Date()
                    lastDay =new Date()

                }
                    
                
                if(firstDay.getMonth===12)
                {
                    firstDay = new Date(firstDay.getFullYear(), 1, 2)
                    lastDay = new Date(lastDay.getFullYear()+1, 2, 1)
                }
                
                else  
                {
                    firstDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1)
                    lastDay = new Date(lastDay.getFullYear(), lastDay.getMonth()+1, 1)
                }
                
                let monthAvgSale=0, monthAvgProfit=0,  dayAvgSale=0,
                todayTarget=0, monthTarget=0, monthTargetProfit=0
                let todaySale, monthProfit, monthSale
                let curDateSales=[], curMonthSale=[], dailySale=[], monthlySale=[]
        
                curDateSales= await Sale.aggregate([
                        { 
                            $match:
                                    {
                                        $and:
                                        [    
                                               {
                                                "createdAt":{
                                                    $gte: today,
                                                    $lte: tomorrow,
                                                }
                                            },
                                            { 'isDeleted': {  '$ne': true}},
                                        ]  
                                    } 
                        },
                        { 
                            $group:
                              {
                                _id: { day: { $dayOfMonth: "$createdAt"}, month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                                gTotal: { $sum:  "$gTotal"  },
                                profit: {$sum: {$subtract:['$gTotal', '$pAmount']}}
                              }, 
                          },
                          
                          {
                              $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                          }
                        ]).limit(1)
                    
        
                dailySale= await Sale.aggregate([
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
                            _id: { day: { $dayOfMonth: "$createdAt"}, month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                            gTotal: { $sum:  "$gTotal"  },
                            profit: {$sum: {$subtract:['$gTotal', '$pAmount']}}
                          }, 
                      },
                      
                      {
                          $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                      }
                    ]).limit(35)
                    

                    if(dailySale && dailySale.length)
                    { 
                        for (let i=0;i<dailySale.length;i++)
                        {
                            dayAvgSale += dailySale[i].gTotal
                        }
        
                        dayAvgSale /= dailySale.length
                        todayTarget= Math.round(dayAvgSale + dayAvgSale/10)
                        if(curDateSales.length && curDateSales[0].gTotal)
                            dayAvgSale = curDateSales[0].gTotal / dayAvgSale
                        else
                            dayAvgSale = 0
                     
                        dayAvgSale=Math.round((dayAvgSale + Number.EPSILON) * 100 ) / 100
                    }

                    dailySale.shift()
        
                    curMonthSale= await Sale.aggregate([
                        { 
                            $match:
                                    {
                                        $and:
                                        [    
                                            
                                               {
                                                "createdAt":{
                                                    $gte: firstDay,
                                                    $lte: lastDay,
                                                }
                                            },
                                            { 'isDeleted': {  '$ne': true}},
                                        ]  
                                    } 
                        },
                        { 
                            $group:
                              {
                                _id: { month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                                gTotal: { $sum:  "$gTotal"  },
                                profit: {$sum: {$subtract:['$gTotal', '$pAmount']}}
                              }, 
                          },
                          
                          {
                              $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                          }
                        ])
                monthlySale= await Sale.aggregate([
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
                                _id: { month: { $month: "$createdAt" } , year: { $year: "$createdAt" } },
                                gTotal: { $sum:  "$gTotal"  },
                                profit: {$sum: {$subtract:['$gTotal', '$pAmount']}}
                              }, 
                          },
                          
                          {
                              $sort:{"_id.year":-1, "_id.month":-1}
                          }
            ]).limit(12)
            
            monthlySale.shift()
            
            if(monthlySale && monthlySale.length)
            { 
                for (let i=0;i<monthlySale.length;i++)
                {
                    monthAvgSale += monthlySale[i].gTotal
                    monthAvgProfit+=monthlySale[i].profit
                }

                monthAvgSale/=monthlySale.length
                monthAvgProfit/=monthlySale.length
                monthTarget = Math.round(monthAvgSale + monthAvgSale/10)
                monthTargetProfit= Math.round(monthAvgProfit + monthAvgProfit/100)
                if(curMonthSale.length && curMonthSale[0].gTotal)
                {
                    monthAvgSale = curMonthSale[0].gTotal /monthAvgSale
                    monthAvgProfit = curMonthSale[0].profit /monthAvgProfit
                }
                else
                    monthAvgSale=0
                monthAvgProfit = Math.round((monthAvgProfit + Number.EPSILON) * 100) / 100
                monthAvgSale= Math.round((monthAvgSale  + Number.EPSILON) * 100) / 100
            }
         
             if(!curDateSales.length)
                todaySale= {sale:0, up:0}
            else
                todaySale ={sale:curDateSales[0].gTotal, up:dayAvgSale}
                
            if(!curMonthSale.length)  
            {
                monthSale= {sale:0, up:0}
                monthProfit= {profit:0, up:0}
            }
               
            else
            {
                monthSale={sale:curMonthSale[0].gTotal, up:monthAvgSale}
                monthProfit = {profit:curMonthSale[0].profit, up:monthAvgProfit}
            }
                
            res.json({todaySale, monthSale, monthProfit, todayTarget, monthTarget, monthTargetProfit})
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

router.route('/getsalesinfo').get(async(req, res)=>{
    try{
        let sale = req.query
        let  myRes
        if(sale.myToken && sale.myId)
            myRes = await Session.findOne({token:sale.myToken, _id:sale.myId}).and({isDeleted:false})
        if(myRes)
            {   
                delete sale.myToken
                delete sale.myId
                let recieveables=[], recentSales=[], pendingSales=[]

                recieveables= await Sale.aggregate([
                    { 
                        $match:
                                {
                                    $and:
                                    [   
                                        {'paymentStatus':{ '$ne':'PAID'}},
                                        { 'isDeleted': {  '$ne': true}},
                                        {'saleStatus':{'$ne':'RETURN'}}
                                    ]  
                                } 
                    },
                    { 
                        $group:
                          {
                            _id: {   paymentStatus:  "$paymentStatus"   },
                            gTotal: { $sum:  "$gTotal"  },
                            amountReceived:{ $sum:  "$amountReceived"}
                          }, 
                      },
                      
                      {
                          $sort:{"_id.year":-1, "_id.month":-1, "_id.day": -1}
                      }
                    ]).limit(2)
                    
                    pendingSales= await Sale.find().and(
                        [
                            {'paymentStatus':{ '$ne':'PAID'}},
                            { 'isDeleted': {  '$ne': true}},
                            {'saleStatus':{'$ne':'RETURN'}}
                            
                        ]
                    ).sort({'createdAt':1})
                
                     recentSales= await Sale.find().and(
                        [
                            { 'isDeleted': {  '$ne': true}},
                        ]
                    ).sort({'createdAt':-1}).limit(30)

                    for (let i in pendingSales)
                    {
                     const index = recentSales.findIndex(sale => sale.saleID=== pendingSales[i].saleID)
                     if(index<0)
                     recentSales.push(pendingSales[i])
                    }
                        
                let receiveableAmount =0
        
                for (let i=0; i<recieveables.length; i++)
                    {
                        receiveableAmount+= recieveables[i].gTotal-recieveables[i].amountReceived
                    }
               
                res.json({receiveableAmount, recentSales})
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


module.exports= router