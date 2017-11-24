'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('feedPost', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        pet_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pets',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING
        },
        shared_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'feedPosts',
                key: 'id'
            }
        },
        likes: {
            type: DataTypes.INTEGER
        },
        comments: {
            type: DataTypes.ARRAY(DataTypes.JSON)
        },
        media: {
            type: DataTypes.ARRAY(DataTypes.JSON)
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'feedPosts',
        paranoid: true,
        underscored: true
    });
};