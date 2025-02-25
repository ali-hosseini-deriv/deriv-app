import React from 'react';
import { useActiveWalletAccount } from '@deriv/api';
import { render, screen } from '@testing-library/react';
import DepositCryptoDisclaimers from '../DepositCryptoDisclaimers';

jest.mock('@deriv/api');

describe('DepositCryptoDisclaimers', () => {
    const mockData = {
        currency: 'ETH',
        currency_config: {
            fractional_digits: 2,
            is_tUSDT: false,
            minimum_deposit: 10,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render with default disclaimer', () => {
        (useActiveWalletAccount as jest.Mock).mockReturnValue({ data: {} });

        render(<DepositCryptoDisclaimers />);

        expect(screen.getByText('To avoid loss of funds:')).toBeInTheDocument();
        expect(screen.getByText('Do not send other cryptocurrencies to this address.')).toBeInTheDocument();
        expect(
            screen.getByText('Make sure to copy your Deriv account address correctly into your crypto wallet.')
        ).toBeInTheDocument();
        expect(screen.queryByText(/A minimum deposit value of/)).not.toBeInTheDocument();
        expect(
            screen.getByText('You’ll receive an email when your deposit starts being processed.')
        ).toBeInTheDocument();
    });

    it('should render with minimum deposit disclaimer for active currency', () => {
        (useActiveWalletAccount as jest.Mock).mockReturnValue({ data: mockData });

        render(<DepositCryptoDisclaimers />);

        expect(screen.getByText('To avoid loss of funds:')).toBeInTheDocument();
        expect(screen.getByText('Do not send other cryptocurrencies to this address.')).toBeInTheDocument();
        expect(
            screen.getByText('Make sure to copy your Deriv account address correctly into your crypto wallet.')
        ).toBeInTheDocument();
        expect(screen.getByText(/A minimum deposit value of/)).toBeInTheDocument();
        expect(screen.getByText(/Ethereum \(ETH\) network/)).toBeInTheDocument();
        expect(
            screen.getByText('You’ll receive an email when your deposit starts being processed.')
        ).toBeInTheDocument();
    });

    it('should render with specific minimum deposit disclaimer for tUSDT', () => {
        const tUSDTData = {
            currency: 'tUSDT',
            currency_config: {
                ...mockData.currency_config,
                is_tUSDT: true,
            },
        };

        (useActiveWalletAccount as jest.Mock).mockReturnValue({ data: tUSDTData });

        render(<DepositCryptoDisclaimers />);

        expect(screen.getByText('To avoid loss of funds:')).toBeInTheDocument();
        expect(screen.getByText('Do not send other cryptocurrencies to this address.')).toBeInTheDocument();
        expect(
            screen.getByText('Make sure to copy your Deriv account address correctly into your crypto wallet.')
        ).toBeInTheDocument();
        expect(screen.getByText(/A minimum deposit value of/)).toBeInTheDocument();
        expect(screen.getByText(/Tron \(TRC20\) network/)).toBeInTheDocument();
        expect(screen.getByText(/Otherwise, a fee is applied./)).toBeInTheDocument();
        expect(
            screen.getByText('You’ll receive an email when your deposit starts being processed.')
        ).toBeInTheDocument();
    });
});
