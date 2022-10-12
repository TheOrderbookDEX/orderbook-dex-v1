import { Account } from '@frugal-wizard/contract-test-helper';
import { OrderType } from './OrderType';

export enum SpecialAccount {
    OPERATOR = 'operator',
    PUPPET = 'puppet',
}

export type OrderOwner = Account | SpecialAccount;

export class Order {
    filled: bigint;
    claimed: bigint;
    deleted: boolean;

    constructor(public owner: OrderOwner, public orderType: OrderType, public price: bigint, public amount: bigint) {
        this.filled = 0n;
        this.claimed = 0n;
        this.deleted = false;
    }

    get available() {
        return this.amount - this.filled;
    }

    get unclaimed() {
        return this.filled - this.claimed;
    }

    get cancelable() {
        return !this.deleted && this.amount != this.filled;
    }

    get claimable() {
        return !this.deleted;
    }

    fill(amount: bigint) {
        const { available } = this;
        if (amount > available) {
            this.filled = this.amount;
            return amount - available;
        } else {
            this.filled += amount;
            return 0n;
        }
    }

    claim(maxAmount: bigint) {
        if (this.deleted) throw new Error('claiming deleted order');
        let amount = this.unclaimed;
        if (amount > maxAmount) {
            amount = maxAmount;
        }
        this.claimed += amount;
        if (this.claimed == this.amount) {
            this.deleted = true;
        }
    }

    cancel() {
        if (this.deleted) throw new Error('canceling deleted order');
        if (this.amount == this.filled) throw new Error('canceling already filled');
        this.amount = this.filled;
        if (this.claimed == this.amount) {
            this.deleted = true;
        }
    }

    transfer(recipient: OrderOwner) {
        this.owner = recipient;
    }
}
