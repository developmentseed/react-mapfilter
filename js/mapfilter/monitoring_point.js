// MonitoringPoint
// ---------------

// MonitoringPoint extends `Backbone.Model` with accessor methods
// which format the model attributes for use in the view templates.
// If the fields on the model should change, you can just change these
// methods without needing to modify the rest of the application.
'use strict'

var _ = require('lodash')

var RESIZER_URL = 'https://resizer.digital-democracy.org/'
var IMAGE_SERVER = 'http://localhost:3211/image/'

// From http://colorbrewer2.org/?type=qualitative&scheme=Paired&n=12
var colors = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#b15928']
var colorIndex = 0

module.exports = require('backbone').Model.extend({
  idAttribute: '_uuid',

  get: function (attr) {
    return this.attributes.properties[attr] || 'not_recorded'
  },

  // returns keys of geojson properties. Omits _prefixed and meta fields
  properties: function () {
    return _.keys(_.omit(this.attributes.properties, function (value, key, object) {
        return key[0] === '_' ||
          _.contains(['meta'], key)
      })
    )
  },

  getColor: function () {
    var color
    var colorField = this.collection.options && this.collection.options.color
    if (this.collection.colors[this.get(colorField)]) {
      color = this.collection.colors[this.get(colorField)]
    } else {
      color = this.collection.colors[this.get(colorField)] = colors[colorIndex]
      colorIndex++
    }
    return color
  },

  // Should return a [lat, lon] array for the point
  coordinates: function () {
    if (!this.attributes.geometry) return

    var lat = this.attributes.geometry.coordinates[1]
    var lon = this.attributes.geometry.coordinates[0]

    return [lat, lon]
  },

  getFormattedCoords: function (digits) {
    digits = digits || 5

    var lat = this.coordinates()[0].toFixed(digits)
    var lon = this.coordinates()[1].toFixed(digits)

    lat += (lat > 0) ? '&deg; N' : '&deg; S'
    lon += (lon > 0) ? '&deg; E' : '&deg; W'

    return lat + ' ' + lon
  },

    getWhat: function () {
    return this._getOther('happening', 'happening_other')
  },

  getImpacts: function () {
    return this._getOther('impacts', 'impacts_other')
  },

  // Creates a formatted, readable string for the location
  getLocation: function () {
    var location = this.get('myarea')
    var titleOrExtension = ''

    if (this.get('landtitle') === 'yes') {
      titleOrExtension = 'land title'
    } else if (this.get('customary') === 'yes') {
      titleOrExtension = 'extension area'
    }
    location = (location && location !== 'other') ? '<em>' + t(location) + '</em> in ' : ''
    location += '<em>' + t(this.get('myarea_village')) + '</em> ' + titleOrExtension
    return location
  },

  getPlacename: function () {
    var placename = this.get('placename')
    if (placename === 'not_recorded') placename = this.get('myarea')
    return this._toSentenceCase(placename)
  },

  getWho: function () {
    return this._getOther('people', 'people_other')
  },

  getWhen: function () {
    return this.get('today')
  },

  getImage: function (x, y) {
    x = x || 800
    y = y || 800
    var imageField = this.collection.options && this.collection.options.image
    var picture = this.attributes.properties[imageField] || this.attributes.properties.picture || this.attributes.properties.photo
    var url
    if (typeof picture === 'string') {
      url = IMAGE_SERVER + this.getId() + '/' + picture
    } else if (picture && picture.originalFilename) {
      url = IMAGE_SERVER + this.getId() + '/' + picture.originalFilename
    }
    return url
  },

  getDate: function () {
    var dateField = this.collection.options ? this.collection.options.timestamp : 'today'
    var d = this.get(dateField).split('-')
    return new Date(d[0], d[1] - 1, d[2])
  },

  getId: function () {
    return this.get('meta').instanceId.replace(/^uuid:/, '')
  },

  // Takes a field that is a space-separated list of values, which may include "other"
  // and formats that field together with the "other" field into a comma-separated
  // list of readable text.
  _getOther: function (attr, attr_other) {
    var value = this.get(attr)
    var output = []

    value.split(' ').forEach(function (v, i) {
      if (v === 'other') {
        output[i] = window.u.capitalize(this.get(attr_other))
      } else {
        output[i] = window.t(attr + '.' + v)
      }
    }, this)

    return output.join(', ')
  },

  // Converts a string to sentence case
  _toSentenceCase: function (s) {
    s = s || ''
    // Matches the first letter in the string and the first letter that follows a
    // period (and 1 or more spaces) and transforms that letter to uppercase.
    return s.replace(/(^[a-z])|(\.\s*[a-z])/g, function (s) { return s.toUpperCase() })
  }
})
