'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('lostAndFound', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY
        },
        media: {
            type: DataTypes.ARRAY(DataTypes.JSON)
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
        species_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'species',
                key: 'id'
            }
        },
        breed_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'breeds',
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
        tableName: 'lostAndFound',
        paranoid: true,
        underscored: true
    });
};