'use strict';

const env = {
    PORT: process.env.PORT || 8000,
    // DATABASE_URL: process.env.DATABASE_URL || 'jdbc:postgresql://146.185.178.206:5432/mapet',
    DATABASE_URL: process.env.DATABASE_URL || 'jdbc:postgresql://127.0.0.1:5432/mapet',
    DATABASE_NAME: process.env.DATABASE_NAME || 'mapet',
    // DATABASE_HOST: process.env.DATABASE_HOST || '146.185.178.206',
    DATABASE_HOST: process.env.DATABASE_HOST || '127.0.0.1',
    DATABASE_USERNAME: process.env.DATABASE_USERNAME || 'bogdanbucur',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'l0standdamnd',
    DATABASE_PORT: process.env.DATABASE_PORT || 5432,
    DATABASE_DIALECT: process.env.DATABASE_DIALECT || 'postgres',

    // NODE_ENV: process.env.NODE_ENV || 'production'
    NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;