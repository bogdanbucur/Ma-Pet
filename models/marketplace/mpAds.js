'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('mpAds', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        active: {
            type: DataTypes.BOOLEAN
        },
        userID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            },
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.BLOB
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        class: {
            type: DataTypes.STRING
        },
        classNo: {
            type: DataTypes.INTEGER
        },
        period: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.FLOAT
        },
        currency: {
            type: DataTypes.STRING
        },
        contact_name: {
            type: DataTypes.STRING
        },
        contact_phone: {
            type: DataTypes.STRING
        },
        contact_email: {
            type: DataTypes.STRING
        },
        contact_address: {
            type: DataTypes.STRING
        },
        contact_website: {
            type: DataTypes.STRING
        },
        media: {
            type: DataTypes.ARRAY(DataTypes.JSON)
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'mpAds',
        paranoid: true,
        underscored: true
    });
};