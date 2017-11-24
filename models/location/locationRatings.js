'use strict';

'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('locationRatings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rateValue: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        userID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        locationID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'locations',
                key: 'id'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'locationRatings',
        paranoid: true,
        underscored: true
    });
};