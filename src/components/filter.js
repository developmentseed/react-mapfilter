const React = require('react')
const { PropTypes } = React
const shouldPureComponentUpdate = require('react-pure-render/function')
const {List, ListItem} = require('material-ui/List')
const AddIcon = require('material-ui/svg-icons/content/add').default

const DiscreteFilter = require('./discrete_filter')
const ContinuousFilter = require('./continuous_filter')
const { analyzeFields,
        buildFilter,
        mergeFilterFields,
        getFiltersByField } = require('../util/filter_helpers')

const style = {
  outer: {
    width: '25%',
    height: '100%',
    minWidth: 200,
    position: 'absolute',
    overflowY: 'auto',
    zIndex: 1,
    boxShadow: 'rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px'
  },
  list: {
    paddingTop: 0
  },
  listItemInner: {
    paddingLeft: 48
  },
  listIcon: {
    left: 0
  }
}

class Filter extends React.Component {
  static propTypes = {
    features: PropTypes.array,
    /* Current filter (see https://www.mapbox.com/mapbox-gl-style-spec/#types-filter) */
    filter: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.string
    ])),
    /* Array of fields to show filters for */
    filterFields: PropTypes.arrayOf(PropTypes.string),
    /* called with valid mapbox-gl filter when updated */
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onUpdate: (x) => x
  }

  shouldComponentUpdate = shouldPureComponentUpdate

  handleFilterUpdate = (filter) => {
    const filtersByField = Object.assign({}, this._cached.filtersByField, getFiltersByField(filter))
    this.props.onUpdate(buildFilter(filtersByField))
  }

  componentWillMount () {
    // We use state to store data derived from props:
    // `filterFieldsToShow`: `this.props.filterFields` is a list of fields to show in
    //   the filter pane, but if a filter is set on a field that is not listed
    //   in `this.props.filterFields` we should show a filter for that too.
    // `filtersByField`: this is an index of filter expressions by field name.
    // `filterableFields`: this is based on analysis of the
    // `this.props.filterCollection` to evaluate which properties (`fields`)
    //   can be filtered, and metadata about each field (`values`, `type`,
    //   `min/max`)
    let filtersByField
    let isValidFilter = true
    try {
      filtersByField = getFiltersByField(this.props.filter)
    } catch (e) {
      console.error(e)
      isValidFilter = false
    }
    this._cached = {
      isValidFilter,
      filterFieldsToShow: mergeFilterFields(this.props.filter, this.props.filterFields),
      filtersByField,
      filterableFields: analyzeFields(this.props.features)
    }
  }

  componentDidUpdate () {
    console.log('filter panel updated')
  }

  componentWillReceiveProps (nextProps) {
    const {filterFields, filter, features} = this.props
    console.log(filterFields !== nextProps.filterFields)
    console.log(filter !== nextProps.filter)
    // if (filterFields !== nextProps.filterFields || filter !== nextProps.filter) {
    //   console.log('merging filter fields')
    //   this._cached.filterFieldsToShow = mergeFilterFields(nextProps.filter, nextProps.filterFields)
    // }
    if (filter !== nextProps.filter) {
      console.log('updating filter in filter panel')
      let isValidFilter = true
      try {
        this._cached.filtersByField = getFiltersByField(nextProps.filter)
      } catch (e) {
        console.error(e)
        isValidFilter = false
      }
      this._cached.isValidFilter = isValidFilter
    }
    if (features !== nextProps.features) {
      this._cached.filterableFields = analyzeFields(nextProps.features)
    }
  }

  render () {
    const {isValidFilter, filterFieldsToShow, filterableFields, filtersByField} = this._cached
    const resetFilter = (
      <div>
        <p>Invalid Filter</p>
        <a onClick={this.props.onUpdate.bind(null, null)}>Click to reset</a>
      </div>
    )
    return (
      <div style={style.outer}><List style={style.list}>
        {!isValidFilter ? resetFilter : filterFieldsToShow
          .filter((f) => filterableFields[f])
          .map((f) => {
            switch (filterableFields[f].type) {
              case 'discrete':
                return <DiscreteFilter
                  key={f}
                  fieldName={f}
                  checked={filtersByField[f] ? filtersByField[f].in : Object.keys(filterableFields[f].values)}
                  values={filterableFields[f].values}
                  onUpdate={this.handleFilterUpdate}
                  />
              case 'number':
              case 'date':
                return <ContinuousFilter
                  key={f}
                  isDate={filterableFields[f].type === 'date'}
                  fieldName={f}
                  filter={filtersByField[f]}
                  min={filtersByField[f] ? filtersByField[f]['>='] : filterableFields[f].min}
                  max={filtersByField[f] ? filtersByField[f]['<='] : filterableFields[f].max}
                  valueMin={filterableFields[f].min}
                  valueMax={filterableFields[f].max}
                  onUpdate={this.handleFilterUpdate}
                  />
            }
          })
        }
        <ListItem
          innerDivStyle={style.listItemInner}
          leftIcon={<AddIcon style={style.listIcon} />}
          primaryText='Add Filter...'
        />
      </List></div>
    )
  }
}

module.exports = Filter
