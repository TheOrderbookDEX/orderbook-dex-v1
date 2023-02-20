import { Account } from '@frugalwizard/contract-test-helper';
import { SpecialAccount } from '../scenario/reentrancy';
import { OrderType } from './OrderType';

export type OrderOwner = Account | SpecialAccount;

export class Order {
    readonly owner: OrderOwner;
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly filled: bigint;
    readonly claimed: bigint;
    readonly deleted: boolean;

    constructor({
        owner,
        orderType,
        price,
        amount,
        filled = 0n,
        claimed = 0n,
        deleted = false,
    }: {
        readonly owner: OrderOwner;
        readonly orderType: OrderType;
        readonly price: bigint;
        readonly amount: bigint;
        readonly filled?: bigint;
        readonly claimed?: bigint;
        readonly deleted?: boolean;
    }) {
        this.owner = owner;
        this.orderType = orderType;
        this.price = price;
        this.amount = amount;
        this.filled = filled;
        this.claimed = claimed;
        this.deleted = deleted;
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

    fill(amount: bigint): Order {
        if (amount > this.available) throw new Error('filling more than available');
        return new Order({
            ...this,
            filled: this.filled + amount
        });
    }

    claim(maxAmount: bigint) {
        if (this.deleted) throw new Error('claiming deleted order');
        const amount = this.unclaimed > maxAmount ? maxAmount : this.unclaimed;
        return new Order({
            ...this,
            claimed: this.claimed + amount,
            deleted: this.claimed + amount == this.amount,
        });
    }

    cancel() {
        if (this.deleted) throw new Error('canceling deleted order');
        if (this.amount == this.filled) throw new Error('canceling already filled');
        return new Order({
            ...this,
            amount: this.filled,
            deleted: this.claimed == this.filled,
        });
    }

    transfer(recipient: string) {
        return new Order({ ...this, owner: recipient });
    }
}
