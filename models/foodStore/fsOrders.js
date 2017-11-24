'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsOrders', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        contact_name: {
            type: DataTypes.STRING
        },
        contact_email: {
            type: DataTypes.STRING
        },
        contact_phone: {
            type: DataTypes.STRING
        },
        contact_address: {
            type: DataTypes.STRING
        },
        contact_city: {
            type: DataTypes.STRING
        },
        paymentType: {
            type: DataTypes.STRING
        },
        deliveryStatus: {
            type: DataTypes.STRING
        },
        completed_at: {
            type: DataTypes.DATE
        },
        total: {
            type: DataTypes.INTEGER
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'fsOrders',
        paranoid: true,
        underscored: true
    });
};