/* global L */
// MapFilter.MapPane
// -----------------

// The MapFilter MapPane manages the map and markers on the map, hiding markers which
// do not match the current filter whenever the filter changes.
//
// `options.center` is a [lat,lon] array of the starting center point for the map
// `options.zoom` is the initial zoom level for the map                                                                                                                                   this.markersById[model.cid]       =    new           MapFilter.MarkerView({ model: model, map:             this.map });     } [description]
// `options.tileUrl` is [URL template](http://leafletjs.com/reference.html#url-template) for map tile layer
'use strict'

var MarkerView = require('./marker_view.js')
var _ = require('lodash')

var WAPICHAN_TILES = 'http://localhost:3001/wapichan/{z}/{x}/{y}.png'
var BING_TILES = 'http://localhost:3001/bing/{z}/{x}/{y}.jpg'

module.exports = require('backbone').View.extend({
  initialize: function (options) {
    console.log(options)
    // Initialize the [Leaflet](http://leafletjs.com/) map attaching to this view's element
    this.map = L.map(this.el, {
      center: options.center,
      zoom: options.zoom,
      scrollWheelZoom: options.scrollWheelZoom || true
    })

    this._interactive = options.interactive

    this.appView = options.appView

    // initialize satellite image caching
    L.bingLayer.initialize = function (key, options) {
      L.Util.setOptions(this, options)

      var cachedMeta = {
        'resourceSets': [{
          'resources': [{
            'imageHeight': 256,
            'imageUrl': 'http:\/\/ecn.{subdomain}.tiles.virtualearth.net\/tiles\/a{quadkey}.jpeg?g=2732',
            'imageUrlSubdomains': ['t0', 't1', 't2', 't3'],
            'imageWidth': 256,
            'imageryProviders': null
          }]
        }],
        'statusCode': 200,
        'statusDescription': 'OK'
      }

      this._key = key
      this._url = null
      this.meta = cachedMeta
      this.initMetadata()
      this.loadMetadata()
    }

    var baseMaps = {}
    baseMaps['Satelite'] = L.tileLayer(BING_TILES)
    baseMaps['Savannah, Bush, Hills'] = L.tileLayer(WAPICHAN_TILES).addTo(this.map)

    L.control.layers(baseMaps).addTo(this.map)

    // Object to hold a reference to any markers added to the map
    this.markersById = {}

    // When a new model is created, add a new marker to the map
    this.listenTo(this.collection, 'add', this.addOne)

    // When the models are initially fetched, or the collection is reset
    // remove and re-add all the markers to the map
    this.listenTo(this.collection, 'firstfetch reset', this.addAll)

    // Remove a marker from the map when the model is removed from collection
    this.listenTo(this.collection, 'remove', this.removeOne)

    // Filter which markers are hidden or shown whenever the collection
    // is filtered
    this.listenTo(this.collection, 'filtered', this.filter)
  },

  // Create a new MarkerView for each model added to the collection,
  // and store a reference to that view in markersById
  addOne: function (model) {
    this.markersById[model.cid] = new MarkerView({
      model: model,
      map: this.map,
      appView: this.appView,
      interactive: this._interactive
    })
  },

  // Remove all the markers from the map and add a marker for each model
  // in the collection
  addAll: function () {
    this.removeAll()
    this.collection.each(this.addOne, this)
    var markerBounds = this.collection.filteredBounds()
    this.map.fitBounds(markerBounds)
  },

  // Remove a single marker for a given model from the map
  removeOne: function (model) {
    this.markersById[model.cid].remove()
    // Remove reference to marker to allow garbage collection
    delete this.markersById[model.cid]
  },

  // Remove all markers from the map
  removeAll: function () {
    _.each(this.markersById, function (v) {
      this.removeOne(v.model)
    }, this)
  },

  // `this.collection.groupByCid.all()` is an array of every model in the collection by `cid`.
  // The value will be 0 for filtered models, 1 for models that are unfiltered.
  // This loops through `this.group.all()` and calls `MapFilter.MarkerView.show()`
  filter: function () {
    var i = 0
    this.collection.groupByCid.all().forEach(function (d) {
      this.markersById[d.key].show(d.value, i)
      i += d.value
    }, this)
  }
})
