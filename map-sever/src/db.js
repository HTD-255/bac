const sql=require('mssql');
require('dotenv').config({path:'./config.env'});


const config={
    user:"sa",
    password:'Abc123@#!',
    server:'161.248.147.115',
    database:'nhatkytauca1',
    options:{
        encrypt:false,
        trustServerCertificate:true
    }
};
async function connectToDb(){
    try {
        await sql.connect(config);
        console.log('Connected to database');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
};

module.exports={sql,connectToDb};
