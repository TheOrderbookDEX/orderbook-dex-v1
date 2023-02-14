import { EthereumSetupContext, SetupAction } from '@frugal-wizard/contract-test-helper';
import { OrderbookFactoryContext } from '../scenario/factory';

export type OrderbookFactoryAction = SetupAction<EthereumSetupContext & OrderbookFactoryContext>;
