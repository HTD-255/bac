const sql=require('mssql');
require('dotenv').config({path:'./config.env'});


const config={
    user:"sa",
    password:'Abc123@#!',
    server:'171.244.40.86',
    database:'nhatkytauca1',
    options: {
        // *** Add or change these options: ***
        encrypt: true,       // Force encryption (required for modern servers)
        trustServerCertificate: true, // Bypass certificate validation (USE WITH CAUTION)
        trustedConnection: false,    // Use SQL Server Authentication
        connectionTimeout: 15000,    // (Optional) Increase timeout
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
