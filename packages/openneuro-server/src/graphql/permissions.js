import Permission from '../models/permission'
import Dataset from '../models/dataset'

// Definitions for permission levels allowed
// Admin is write + manage user permissions
export const states = {
  READ: {
    errorMessage: 'You do not have access to read this dataset.',
    allowed: ['ro', 'rw', 'admin'],
  },
  WRITE: {
    errorMessage: 'You do not have access to modify this dataset.',
    allowed: ['rw', 'admin'],
  },
  ADMIN: {
    errorMessage: 'You do not have admin access to this dataset.',
    allowed: ['admin'],
  },
}

/**
 * Query to check if datasets exist and are accessible due to public flag
 * @param {string} datasetId
 * @param {string} userId
 * @param {object} userInfo
 * @returns {object} MongoDB query object
 */
export const datasetReadQuery = (datasetId, userId, userInfo) => {
  if (!userId || (userInfo && !userInfo.admin)) {
    return { id: datasetId, public: true }
  } else {
    return { id: datasetId }
  }
}

/**
 * Check for permission levels
 * @param {object} permission Permission object
 * @param {object} permission.level Field defining the current permission
 * @param {object} state Permission state type
 * @param {object} state.allowed Levels allowed for this permission state
 * @returns {boolean} Access allowed
 */
export const checkPermissionLevel = (permission, state) => {
  if (permission && state.allowed.includes(permission.level)) {
    return true
  } else {
    return false
  }
}

export const checkDatasetExists = async datasetId => {
  const found = await Dataset.count({ id: datasetId }).exec()
  if (!found) throw new Error(`Dataset ${datasetId} does not exist.`)
}

export const checkDatasetRead = async (datasetId, userId, userInfo) => {
  // Check that dataset exists.
  await checkDatasetExists(datasetId)
  // Look for any matching datasets
  const datasetFound = await Dataset.findOne(
    datasetReadQuery(datasetId, userId, userInfo),
  ).exec()
  // Found a dataset and don't need to match further (public or admin user)
  if (datasetFound) {
    return true
  } else {
    // Did not find a dataset, check permissions for additional read access
    const permission = await Permission.findOne({ datasetId, userId }).exec()
    if (checkPermissionLevel(permission, states.READ)) {
      return true
    } else {
      throw new Error(states.READ.errorMessage)
    }
  }
}

/**
 * General verification of dataset permission given a dataset and user
 * @param {string} datasetId Accession number for dataset
 * @param {string} userId User UUID
 * @param {object} userInfo User details object
 * @param {object} state Level to verify
 */

export const checkDatasetWrite = async (
  datasetId,
  userId,
  userInfo,
  state = states.WRITE,
) => {
  await checkDatasetExists(datasetId)
  if (!userId) {
    // Quick path for anonymous writes
    throw new Error(state.errorMessage)
  }
  if (userId && userInfo.admin) {
    // Always allow site admins
    return true
  }
  const permission = Permission.findOne({ datasetId, userId }).exec()
  if (checkPermissionLevel(permission, state)) {
    return true
  } else {
    throw new Error(state.errorMessage)
  }
}

export const checkDatasetAdmin = (datasetId, userId, userInfo) =>
  checkDatasetWrite(datasetId, userId, userInfo, states.ADMIN)

export const checkAdmin = (userId, userInfo) =>
  userId && userInfo.admin
    ? Promise.resolve(true)
    : Promise.reject(states.ADMIN.errorMessage)
