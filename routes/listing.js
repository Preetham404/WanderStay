const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const Listing = require('../models/listing.js');
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

const categoryMap = {
  'trending':      'Trending',
  'rooms':         'Rooms',
  'iconic-cities': 'Iconic Cities',
  'mountains':     'Mountains',
  'castles':       'Castles',
  'amazing-pools': 'Amazing Pools',
  'camping':       'Camping',
  'farms':         'Farms',
  'arctic':        'Arctic',
  'beachfront':    'Beachfront',
  'luxury':        'Luxury',
  'pet-friendly':  'Pet Friendly',
};

router.get('/category/:category', wrapAsync(async (req, res) => {
  const { category } = req.params;
  const categoryValue = categoryMap[category];

  if (!categoryValue) {
    req.flash('error', 'Category not found');
    return res.redirect('/listings');
  }

  const filteredListings = await Listing.find({ category: categoryValue }).populate('owner');

  res.render('listings/index.ejs', {
    allListings: filteredListings,
    searchTerm: '',
    isSearch: false,
    activeFilter: category,
    filterTitle: categoryValue,
  });
}));

router.route('/')
  .get(wrapAsync(async (req, res) => {
    const { search } = req.query;

    if (search && search.trim() !== '') {
      const allListings = await Listing.find({}).populate('owner');

      const listingsWithScore = allListings.map(listing => {
        let score = 0;
        const searchTerm = search.toLowerCase().trim();
        const title       = listing.title?.toLowerCase() || '';
        const description = listing.description?.toLowerCase() || '';
        const location    = listing.location?.toLowerCase() || '';
        const country     = listing.country?.toLowerCase() || '';
        const category    = listing.category?.toLowerCase() || '';

        if (title === searchTerm)              score += 100;
        else if (title.startsWith(searchTerm)) score += 75;
        else if (title.includes(searchTerm))   score += 50;

        if (location.includes(searchTerm))     score += 30;
        if (country.includes(searchTerm))      score += 20;
        if (category.includes(searchTerm))     score += 25;
        if (description.includes(searchTerm))  score += 15;

        return { ...listing.toObject(), score };
      });

      const matchingListings = listingsWithScore
        .filter(l => l.score > 0)
        .sort((a, b) => b.score - a.score);

      return res.render('listings/index.ejs', {
        allListings: matchingListings,
        searchTerm: search,
        isSearch: true,
        activeFilter: null,
        filterTitle: null,
      });
    }

    const allListings = await Listing.find({}).populate('owner');
    res.render('listings/index.ejs', {
      allListings,
      searchTerm: '',
      isSearch: false,
      activeFilter: null,
      filterTitle: null,
    });
  }))
  .post(isLoggedIn, upload.single('listing[image]'), wrapAsync(listingController.createListing));

router.get('/new', isLoggedIn, listingController.renderNewForm);

router.route('/:id')
  .get(wrapAsync(listingController.showListing))
  .put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

router.get('/:id/edit', isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;