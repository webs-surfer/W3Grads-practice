const express = require('express');
const app = express();
const port = 3000
const data = [
    {'id':1,'name':'rohan','age':10},
    {'id':2,'name':'rohan','age':10},
    {'id':3,'name':'rohan','age':10}
]
app.get('/',(req,res)=>{
    res.json("server is running")
})
app.get('/data',(req,res)=>{
    res.json(data)
})
app.listen(port,()=>{
    console.log(`Server is running at ${port}`)
})