import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import { withRouter } from 'react-router-dom'

const CREATE_SNAPSHOT = gql`
  mutation createSnapshot($datasetId: ID!, $tag: String!) {
    createSnapshot(datasetId: $datasetId, tag: $tag) {
      id
      tag
      created
    }
  }
`

// TODO - reuse this fragment in dataset-query.jsx?
const SNAPSHOT_CREATED = gql`
  fragment SnapshotCreated on Dataset {
    id
    snapshots {
      id
      tag
      created
    }
  }
`

const SnapshotDataset = ({ history, datasetId, tag }) => (
  <Mutation
    mutation={CREATE_SNAPSHOT}
    update={(cache, { data: { createSnapshot } }) => {
      const datasetCacheId = `Dataset:${datasetId}`
      // Fetch known snapshots
      const { snapshots } = cache.readFragment({
        id: datasetCacheId,
        fragment: SNAPSHOT_CREATED,
      })
      cache.writeFragment({
        id: datasetCacheId,
        fragment: SNAPSHOT_CREATED,
        data: {
          __typename: 'Dataset',
          id: datasetId,
          snapshots: [...snapshots, createSnapshot],
        },
      })
    }}>
    {snapshotDataset => (
      <button
        className="btn-modal-action"
        onClick={() =>
          snapshotDataset({ variables: { datasetId, tag } }).then(() => {
            history.push(`/datasets/${datasetId}/versions/${tag}`)
          })
        }>
        Create Snapshot
      </button>
    )}
  </Mutation>
)

SnapshotDataset.propTypes = {
  datasetId: PropTypes.string,
  tag: PropTypes.string,
  history: PropTypes.object,
}

export default withRouter(SnapshotDataset)
