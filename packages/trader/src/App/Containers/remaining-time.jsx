import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'Stores/connect';
import { formatDuration, getDiffDuration } from 'Utils/Date';

const RemainingTime = ({ end_time = null, start_time, format }) => {
    if (!+end_time || start_time.unix() > +end_time) {
        return '';
    }

    const remaining_time = formatDuration(getDiffDuration(start_time.unix(), end_time), format);
    const is_zeroes = /^00:00$/.test(remaining_time);

    return !is_zeroes && <div className='remaining-time'>{remaining_time}</div>;
};

RemainingTime.propTypes = {
    end_time: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    start_time: PropTypes.object,
};

export default connect(({ common }) => ({
    start_time: common.server_time,
}))(RemainingTime);
