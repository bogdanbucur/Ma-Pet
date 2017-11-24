'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    Sequelize = require('sequelize'),
    Op = Sequelize.Op,
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    multer = require('multer'),
    fse = require('fs-extra'),
    upload = multer({dest: 'uploads/'}),
    asyncMiddleware = fn =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        };

router.post('/createBrand', isLoggedIn, upload.single('logo'), (req, res) => {
    let data = null;
    if (req.file) {
        const tempFile = req.file.destination + req.file.filename,
            newFile = 'uploads/foodStore/brands/' + '/' + req.file.filename + '_' + req.file.originalname;
        return fse.copy(tempFile, newFile)
            .then(() => data = newFile)
    }
    if (!req.body.name) {
        return res.json(response.response(false, 'A name is required.', null))
    }

    return db.fsBrands.create({
        name: req.body.name,
        logo: data
    })
        .then((brand) => {
            return res.json(response.response(true, 'Brand created.', {brand}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/createCategory', isLoggedIn, upload.single('logo'), (req, res) => {
    let data = null;
    if (req.file) {
        const tempFile = req.file.destination + req.file.filename,
            newFile = 'uploads/foodStore/categories/' + '/' + req.file.filename + '_' + req.file.originalname;
        return fse.copy(tempFile, newFile)
            .then(() => data = newFile)
    }
    if (!req.body.name) {
        return res.json(response.response(false, 'A name is required.', null))
    }

    return db.fsCategories.create({
        name: req.body.name,
        logo: data,
        active: true
    })
        .then((brand) => {
            return res.json(response.response(true, 'Category created.', {brand}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/addProperty/:id', isLoggedIn, (req, res) => {
    const array = req.body.values;
    console.log(typeof array, array);
    if (typeof array !== 'object') {
        return res.json(response.response(false, '\'array\' must be an array.', null))
    }

    return db.fsProperties.create({
        category_id: req.params.id,
        name: req.body.name
    })
        .then((property) => {
            let values = [];
            return Promise.mapSeries(array, (value) => {
                return db.fsPropertyValues.create({
                    property_id: property.id,
                    name: value
                })
                    .then((value) => {
                        values.push(value);
                        return values;
                    })
            })
                .then(() => {
                    return res.json(response.response(true, 'Property created.', {property, values}))
                })
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/createProduct', isLoggedIn, (req, res) => {
    /*property = {
        prop: property_id,
        val: value_id
    }*/

    if (!req.body.name) {
        return res.json(response.response(false, 'A name is required.', null))
    }
    if (!req.body.description) {
        return res.json(response.response(false, 'A description is required.', null))
    }
    if (!req.body.packageType) {
        return res.json(response.response(false, 'A package type is required.', null))
    }
    if (!req.body.price) {
        return res.json(response.response(false, 'A price is required.', null))
    }
    if (!req.body.brand_id) {
        return res.json(response.response(false, 'A brand id is required.', null))
    }
    if (!req.body.category_id) {
        return res.json(response.response(false, 'A category id is required.', null))
    }

    const brand_id = req.body.brand_id;
    const category_id = req.body.category_id;
    const properties = req.body.property;

    return db.fsProducts.create({
        name: req.body.name,
        description: req.body.description,
        packageType: req.body.packageType,
        price: req.body.price,
        brand_id: brand_id,
        category_id: category_id,
        rating: 0,
        ratingCount: 0
    })
        .then((product) => {
            return Promise.mapSeries(properties, (property) => {
                return db.fsProductsProps.create({
                    product_id: product.id,
                    property_id: property.prop,
                    value_id: property.val
                });
            })
                .then(() => product)
        })
        .then((product) => {
            return Promise.all([
                db.fsProducts.findById(product.id),
                db.fsProductsProps.findAll({
                    where: {
                        product_id: product.id
                    },
                    include: [
                        {model: db.fsPropertyValues, as: 'Value'}
                    ]
                })
            ])
                .then((queryRes) => {
                    const product = queryRes[0];
                    const properties = queryRes[1];
                    return res.json(response.response(true, 'Created Product.', {product, properties}))
                })
        })
});

router.get('/brands', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;

    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.page) {
        page = parseInt(req.query.page);
    }

    const offset = limit * (page - 1);

    return db.fsBrands.findAll({
        limit: limit,
        offset: offset
    })
        .then((brands) => {
            return res.json(response.response(true, 'Found all brands.', {brands}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/categories', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;

    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.page) {
        page = parseInt(req.query.page);
    }

    const offset = limit * (page - 1);

    return db.fsCategories.findAll({
        limit: limit,
        offset: offset
    })
        .then((categories) => {
            return res.json(response.response(true, 'Found all categories.', {categories}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/products', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;

    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.page) {
        page = parseInt(req.query.page);
    }

    const offset = limit * (page - 1);

    return db.fsProducts.findAll({
        limit: limit,
        offset: offset
    })
        .then((products) => {
            let data = [];
            return Promise.mapSeries(products, (product) => {
                return db.fsProductsProps.findAll({
                    where: {
                        product_id: product.id
                    },
                    include: [
                        {model: db.fsProperties, as: 'Property'},
                        {model: db.fsPropertyValues, as: 'Value'}
                    ]
                })
                    .then((properties) => {
                        data.push({product, properties});
                        return data;
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            })
                .then(() => {
                    return res.json(response.response(true, 'Found all products.', {data}))
                })
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/markFavourite/:id', isLoggedIn, (req, res) => {
    return db.fsFavouriteProducts.findOne({
        where: {
            user_id: req.user.id,
            product_id: req.params.id
        }
    })
        .then((favProduct) => {
            if (!favProduct) {
                return db.fsFavouriteProducts.create({
                    favourite: true,
                    user_id: req.user.id,
                    product_id: req.params.id
                })
                    .then((fav) => {
                        return res.json(response.response(true, 'Marked product as favourite.', {fav}))
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            } else {
                switch (favProduct.favourite) {
                    case true:
                        return favProduct.updateAttributes({
                            favourite: false
                        })
                            .then((newFav) => {
                                return res.json(response.response(true, 'Unmarked product as favourite.', {newFav}))
                            });
                        break;
                    case false:
                        return favProduct.updateAttributes({
                            favourite: true
                        })
                            .then((newFav) => {
                                return res.json(response.response(true, 'Marked product as favourite.', {newFav}))
                            });
                        break;
                    default:
                        return;
                }
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/rateProduct/:id', isLoggedIn, (req, res) => {
    const rate = parseFloat(req.body.rating);

    return db.fsProductRatings.findOne({
        where: {
            user_id: req.user.id,
            product_id: req.params.id,
        }
    })
        .then((rating) => {
            if (!rating) {
                return Promise.all([
                    db.fsProductRatings.create({
                        user_id: req.user.id,
                        product_id: req.params.id,
                        rating: rate.toFixed(1)
                    }),
                    db.fsProducts.findById(req.params.id)
                ])
                    .then((queryRes) => {
                        let avgRating = (queryRes[1].rating * queryRes[1].ratingCount + rate) / (queryRes[1].ratingCount + 1);
                        const ratingCount = queryRes[1].ratingCount;

                        return queryRes[1].updateAttributes({
                            rating: avgRating.toFixed(1),
                            ratingCount: ratingCount + 1
                        })
                            .then((newRate) => res.json(response.response(true, 'Product has been rated.', {newRate})))
                            .catch((err) => {
                                console.log(err);
                                return res.json(response.error())
                            })
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            } else {
                return Promise.all([
                    db.fsProductRatings.findById(rating.id),
                    db.fsProducts.findById(rating.product_id)
                ])
                    .then((queryRes) => {
                        let oldRating = queryRes[0].rating;
                        return queryRes[0].updateAttributes({
                            rating: rate.toFixed(1)
                        })
                            .then(() => {
                                let avgRating = (queryRes[1].rating * queryRes[1].ratingCount - oldRating + rate) / queryRes[1].ratingCount;
                                return queryRes[1].updateAttributes({
                                    rating: avgRating.toFixed(1)
                                })
                                    .then((newRate) => res.json(response.response(true, 'Product rating has been updated.', {newRate})))
                                    .catch((err) => {
                                        console.log(err);
                                        return res.json(response.error())
                                    })
                            })
                            .catch((err) => {
                                console.log(err);
                                return res.json(response.error())
                            })
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/favouriteProducts', isLoggedIn, (req, res) => {
    return db.fsFavouriteProducts.findAll({
        where: {
            user_id: req.user.id
        },
        include: [
            {model: db.fsProducts, as: 'Product'}
        ]
    })
        .then((products) => {
            return res.json(response.response(true, 'Found all favourite products for user.', {products}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/createOrder', isLoggedIn, (req, res) => {
    const products = req.body.products;
    console.log(products);
    let total = 0;
    products.forEach((product) => {
        total += parseInt(product.quantity);
    });
    if (!req.body.name) {return res.json(response.response(false, 'A name is required.', null))}
    if (!req.body.email) {return res.json(response.response(false, 'An email is required.', null))}
    if (!req.body.phone) {return res.json(response.response(false, 'A phone number is required.', null))}
    if (!req.body.address) {return res.json(response.response(false, 'An address is required.', null))}
    if (!req.body.city) {return res.json(response.response(false, 'A city is required.', null))}
    if (!req.body.paymentType) {return res.json(response.response(false, 'Payment type is required.', null))}

    return db.fsOrders.create({
        user_id: req.user.id,
        contact_name: req.body.name,
        contact_email: req.body.email,
        contact_phone: req.body.phone,
        contact_address: req.body.address,
        contact_city: req.body.city,
        paymentType: req.body.paymentType,
        deliveryStatus: 'Pending',
        total: total
    })
        .then((order) => {
            let data = [];
            data.push(order);
            return Promise.mapSeries(products, (product) => {
                return db.fsOrderProducts.create({
                    order_id: order.id,
                    product_id: parseInt(product.id)
                })
                    .then((product) => {
                        data.push(product);
                    })
            })
                .then(() => data)
        })
        .then((order) => {
            return res.json(response.response(true, 'Order created.', {order}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/allOrders', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;
    if (req.query.max) {limit = parseInt(req.query.max);}
    if (req.query.page) {page = parseInt(req.query.page);}
    const offset = limit * (page - 1);
    return db.fsOrders.findAll({
        limit: limit,
        offset: offset
    })
        .then((orders) => {
            let data = [];
            return Promise.mapSeries(orders, (Order) => {
                let order = {};
                order.order = Order;
                return db.fsOrderProducts.findAll({
                    where: {
                        order_id: Order.id
                    },
                    include: [
                        {model: db.fsProducts, as: 'Product'}
                    ]
                })
                    .then((products) => {
                        order.products = products;
                        data.push(order);
                    })
            })
                .then(() => data)
        })
        .then((data) => {
            return res.json(response.response(true, 'Got all orders.', {data}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/myOrders', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;
    if (req.query.max) {limit = parseInt(req.query.max);}
    if (req.query.page) {page = parseInt(req.query.page);}
    const offset = limit * (page - 1);
    return db.fsOrders.findAll({
        limit: limit,
        offset: offset,
        where: {
            user_id: req.user.id
        }
    })
        .then((orders) => {
            let data = [];
            return Promise.mapSeries(orders, (Order) => {
                let order = {};
                order.order = Order;
                return db.fsOrderProducts.findAll({
                    where: {
                        order_id: Order.id
                    },
                    include: [
                        {model: db.fsProducts, as: 'Product'}
                    ]
                })
                    .then((products) => {
                        order.products = products;
                        data.push(order);
                    })
            })
                .then(() => data)
        })
        .then((data) => {
            return res.json(response.response(true, 'Got all orders.', {data}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deleteProduct/:id', (req, res) => {
    return Promise.all([
        db.fsProducts.destroy({
            where: {
                id: req.params.id
            }
        }),
        db.fsFavouriteProducts.destroy({
            where: {
                product_id: req.params.id
            },
            force: true
        }),
        db.fsProductsProps.destroy({
            where: {
                product_id: req.params.id
            },
            force: true
        }),
        db.fsProductRatings.destroy({
            where: {
                product_id: req.params.id
            },
            force: true
        })
    ])
        .then(() => res.json(response.response(true, 'Product deleted.', null)))
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deleteCategory/:id', asyncMiddleware(async (req, res, next) => {
    return db.fsCategories.findById(req.params.id)
        .then((category) => {
            if (!category) {
                return res.json(response.response(false, 'Category not found.', null))
            } else {
                const products = async () => {
                    await db.fsProducts.findAll({
                        where: {
                            category_id: category.id
                        }
                    })
                        .then((res) => res)
                };
                if (products) {
                    return res.json(response.response(false, 'Cannot delete category due to it having products.', null))
                } else {
                    return category.destroy({force: true})
                        .then(() => res.json(response.response(true, 'Category deleted.', null)))
                }
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
}));

router.post('/changeCategoryStatus/:id', asyncMiddleware(async(req, res, next) => {
    const category = await db.fsCategories.findById(req.params.id);
    let newCategory = null;
    switch (category.active) {
        case true:
            newCategory = await category.updateAttributes({
                active: false
            });
            return res.json(response.response(true, 'Category is now inactive.', {newCategory}));
            break;
        case false:
            newCategory = await category.updateAttributes({
                active: true
            });
            return res.json(response.response(true, 'Category is now inactive.', {newCategory}));
            break;
        default:
            return;
    }
}));

router.delete('/deleteBrand:id', asyncMiddleware(async(req, res, next) => {
    const brand = await db.fsBrands.findById(req.params.id);

    if (!brand) {
        return res.json(response.response(false, 'Brand not found.', null))
    } else {
        const products = await db.fsProducts.findAll({
            where: {
                brand_id: brand.id
            }
        });
        return Promise.mapSeries(products, (product) => {
            const favourites = async () => {
                await db.fsFavouriteProducts.destroy({
                    where: {
                        product_id: product.id
                    },
                    force: true
                })
            };
            const orders = async () => {
                await db.fsOrderProducts.destroy({
                    where: {
                        product_id: product.id
                    },
                    force: true
                })
            } ;
            const ratings = async () => {
                await db.fsProductRatings.destroy({
                    where: {
                        product_id: product.id
                    },
                    force: true
                })
            };
            const productProps = async () => {
                await db.fsProductsProps.destroy({
                    where: {
                        product_id: product.id
                    },
                    force: true
                })
            };
        })
            .then(() => {
                return products.destroy({
                    force: true
                })
                    .then(() => res.json(response.response(true, 'Brand and everything related to it has been deleted.', null)))
            })
    }
}));

router.delete('/deleteProperty/:id', (req, res) => {
    return Promise.all([
        db.fsProperties.destroy({
            where: {
                id: req.params.id
            },
            force: true
        }),
        db.fsPropertyValues.destroy({
            where: {
                property_id: req.params.id
            },
            force: true
        })
    ])
        .then(() => res.json(response.response(true, 'Property deleted.', null)))
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deleteValue/:id', (req, res) => {
    return db.fsPropertyValues.destroy({
        where: {
            id: req.params.id
        },
        force: true
    })
        .then(() => res.json(true, 'Porperty value deleted.', null))
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deleteOrder/:id', (req, res) => {
    return Promise.all([
        db.fsOrders.destroy({
            where: {
                id: req.params.id,
            }
        }),
        db.fsOrderProducts.destroy({
            where: {
                order_id: req.params.id
            }
        })
    ])
        .then(() => res.json(response.response(true, 'Order deleted.', null)))
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        res.redirect('/user/loginFail');
    }
}