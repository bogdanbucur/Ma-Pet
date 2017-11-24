'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('feedCommentLikes', {
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
        comment_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'feedComments',
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
        tableName: 'feedCommentLikes',
        paranoid: true,
        underscored: true
    });
};