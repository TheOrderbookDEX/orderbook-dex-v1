import { EthereumSetupContext, SetupAction } from '@frugal-wizard/contract-test-helper';
import { OrderbookContext } from '../scenario/orderbook';
import { Orders } from '../state/Orders';

export type OrderbookAction = SetupAction<EthereumSetupContext & OrderbookContext> & {
    apply(orders: Orders): Orders;
};
