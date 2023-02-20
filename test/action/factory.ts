import { EthereumSetupContext, SetupAction } from '@frugalwizard/contract-test-helper';
import { OrderbookFactoryContext } from '../scenario/factory';

export type OrderbookFactoryAction = SetupAction<EthereumSetupContext & OrderbookFactoryContext>;
