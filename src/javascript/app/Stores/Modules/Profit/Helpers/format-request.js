import {
    epochToMoment,
    toMoment,
} from 'Utils/Date';

const getDateTo = (partial_fetch_time, date_to) => {
    if (partial_fetch_time) {
        return toMoment().endOf('day').unix();
    } else if (date_to) {
        return epochToMoment(date_to)
            .add(1, 'd')
            .subtract(1, 's')
            .unix();
    }
    return toMoment().endOf('day').unix();
};

const getDateBoundaries = (date_from, date_to, partial_fetch_time, should_load_partially = false) => (
    {
        ...(
            date_from || should_load_partially
        ) && { date_from: partial_fetch_time || date_from }, ...(
            date_to || should_load_partially
        ) && {
            date_to: getDateTo(partial_fetch_time, date_to),
        },
    }
);

export default getDateBoundaries;
