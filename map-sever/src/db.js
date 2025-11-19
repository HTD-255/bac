    const sql=require('mssql');
require('dotenv').config({path:'./config.env'});

const config={
    server: process.env.DB_HOST || '157.66.100.146',
    user: process.env.DB_USER || 'bac',
    password: process.env.DB_PASSWORD || 'Abc123@#!',
    database: process.env.DB_NAME || 'nhatkytauca1',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableKeepAlive: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
    }
};
async function connectToDb(){
    try {
        console.log(`📋 Attempting to connect to ${config.server}:1433...`);
        await sql.connect(config);
        console.log('✅ Connected to database');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('📌 Config:', {server: config.server, user: config.user, database: config.database});
        console.warn('⚠️ App will continue without database. Some features may not work.');
        return false;
    }
};

module.exports={sql,connectToDb};
