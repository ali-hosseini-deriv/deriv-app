import React from 'react';
import moment from 'moment';
import { useSettings } from '@deriv/api';
import { fireEvent, render, screen } from '@testing-library/react';
import { FlowProvider, FlowTextField } from '../../../../../../../components';
import IDVDocumentUploadDetails from '../IDVDocumentUploadDetails';

jest.mock('@deriv/api', () => ({
    useSettings: jest.fn(),
}));

describe('IDVDocumentUploadDetails', () => {
    beforeEach(() => {
        (useSettings as jest.Mock).mockReturnValue({
            data: {
                date_of_birth: 0,
                first_name: 'John',
                last_name: 'Doe',
            },
        });
    });

    test('should render component with default values', () => {
        render(
            <FlowProvider
                initialValues={{
                    test: 'default',
                }}
                screens={{
                    test: <FlowTextField name='test' />,
                }}
            >
                {() => {
                    return <IDVDocumentUploadDetails />;
                }}
            </FlowProvider>
        );

        expect(screen.getByLabelText('First name*')).toHaveValue('John');
        expect(screen.getByLabelText('Last name*')).toHaveValue('Doe');
        expect(screen.getByLabelText('Date of birth*')).toHaveValue('1970-01-01');
        expect(
            screen.getByLabelText(/I confirm that the name and date of birth above match my chosen identity document/)
        ).toBeInTheDocument();
    });

    test('should render component with date of birth if existing in getSettings', () => {
        (useSettings as jest.Mock).mockReturnValue({
            data: {
                date_of_birth: moment().subtract(25, 'years').unix(),
                first_name: 'John',
                last_name: 'Doe',
            },
        });

        render(
            <FlowProvider
                initialValues={{
                    test: 'default',
                }}
                screens={{
                    test: <FlowTextField name='test' />,
                }}
            >
                {() => {
                    return <IDVDocumentUploadDetails />;
                }}
            </FlowProvider>
        );

        expect(screen.getByLabelText('First name*')).toHaveValue('John');
        expect(screen.getByLabelText('Last name*')).toHaveValue('Doe');
        expect(screen.getByLabelText('Date of birth*')).toHaveValue(
            moment().subtract(25, 'years').format('YYYY-MM-DD')
        );
        expect(
            screen.getByLabelText(/I confirm that the name and date of birth above match my chosen identity document/)
        ).toBeInTheDocument();
    });

    test('should handle checkbox and fields change correctly when checkbox is checked', () => {
        render(
            <FlowProvider
                initialValues={{
                    test: 'default',
                }}
                screens={{
                    test: <FlowTextField name='test' />,
                }}
            >
                {() => {
                    return <IDVDocumentUploadDetails />;
                }}
            </FlowProvider>
        );

        fireEvent.click(
            screen.getByLabelText(/I confirm that the name and date of birth above match my chosen identity document/)
        );

        expect(screen.getByLabelText('First name*')).toBeDisabled();
        expect(screen.getByLabelText('Last name*')).toBeDisabled();
        expect(screen.getByLabelText('Date of birth*')).toBeDisabled();

        fireEvent.click(
            screen.getByLabelText(/I confirm that the name and date of birth above match my chosen identity document/)
        );

        expect(screen.getByLabelText('First name*')).toBeEnabled();
        expect(screen.getByLabelText('Last name*')).toBeEnabled();
        expect(screen.getByLabelText('Date of birth*')).toBeEnabled();
    });
});
