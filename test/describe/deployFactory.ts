import { formatValue } from '@frugalwizard/abi2ts-lib';
import { DeployAddress } from '../utils/addresses';

export function describeDeployOrderbookFactoryScenario({
    fee,
    addressBookAddress,
}: {
    readonly fee: bigint;
    readonly addressBookAddress: string;
}): string {
    const description = ['deploy factory'];
    const settings = [];
    if (fee) {
        settings.push(`fee = ${formatValue(fee)}`);
    }
    if (addressBookAddress != DeployAddress) {
        settings.push(`addressBook = ${addressBookAddress}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
}
