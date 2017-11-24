'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('feedCommentsJunction', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        parent_comment_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'feedComments',
                key: 'id'
            }
        },
        child_comment_id: {
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
        tableName: 'feedCommentsJunction',
        paranoid: true,
        underscored: true
    });
};