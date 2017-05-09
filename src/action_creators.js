export const updateFilter = createActionCreator('UPDATE_FILTER')
export const removeFilter = createActionCreator('REMOVE_FILTER')
export const updateVisibleFilters = createActionCreator('UPDATE_VISIBLE_FILTERS')
export const updateVisibleFields = createActionCreator('UPDATE_VISIBLE_FIELDS')
export const updateFieldMapping = createActionCreator('UPDATE_FIELD_MAPPING')
export const changeCoordinates = createActionCreator('CHANGE_COORDINATE_FORMAT')
export const moveMap = createActionCreator('MOVE_MAP')
export const replaceFeatures = createActionCreator('REPLACE_FEATURES')
export const addFeatures = createActionCreator('ADD_FEATURES')
export const replaceMapStyle = createActionCreator('REPLACE_MAP_STYLE')
export const openSettings = createActionCreator('OPEN_SETTINGS')
export const showFeatureDetail = createActionCreator('SHOW_FEATURE_DETAIL')
export const closeModal = createActionCreator('CLOSE_MODAL')
export const switchView = createActionCreator('SWITCH_VIEW')
export const redirectView = createActionCreator('REDIRECT_VIEW')

function createActionCreator (type) {
  return function (payload) {
    return {type: type, payload}
  }
}
