import React from 'react';
import PropTypes from 'prop-types';

const StoreErrorMessages = ({ storesFetched, stores, locationError, storesError }) => {
  if (storesFetched && stores.length === 0 && !locationError && !storesError) {
    return (
      <div className="no-stores-found-message">
        No stores found near your location. Try adjusting your location or checking back later.
      </div>
    );
  }

  if (storesError) {
    return (
      <div className="stores-fetched-error-message">
        <p>Error fetching stores: {storesError}. Please try again later.</p>
      </div>
    );
  }
  
  return null;
};

StoreErrorMessages.propTypes = {
  storesFetched: PropTypes.bool.isRequired,
  stores: PropTypes.array.isRequired,
  locationError: PropTypes.string,
  storesError: PropTypes.string,
};

export default StoreErrorMessages;