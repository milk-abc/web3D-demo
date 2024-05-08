import {IPointCloudTreeNode} from '../types';

export type Node = IPointCloudTreeNode;

export class LRUItem 
{
	next: LRUItem | null = null;

	previous: LRUItem | null = null;

	constructor(public node: Node) {}
}


export class LRU 
{
	
	first: LRUItem | null = null;

	
	last: LRUItem | null = null;

	numPoints: number = 0;

	private items = new Map<number, LRUItem>();

	constructor(public pointBudget: number = 1_000_000) {}

	get size(): number 
	{
		return this.items.size;
	}

	has(node: Node): boolean 
	{
		return this.items.has(node.id);
	}

	
	touch(node: Node) 
	{
		if (!node.loaded) 
		{
			return;
		}

		const item = this.items.get(node.id);
		if (item) 
		{
			this.touchExisting(item);
		}
		else 
		{
			this.addNew(node);
		}
	}

	private addNew(node: Node): void 
	{
		const item = new LRUItem(node);
		item.previous = this.last;
		this.last = item;
		if (item.previous) 
		{
			item.previous.next = item;
		}

		if (!this.first) 
		{
			this.first = item;
		}

		this.items.set(node.id, item);
		this.numPoints += node.numPoints;
	}

	private touchExisting(item: LRUItem): void 
	{
		if (!item.previous) 
		{
			
			if (item.next) 
			{
				this.first = item.next;
				this.first.previous = null;
				item.previous = this.last;
				item.next = null;
				this.last = item;

				if (item.previous) 
				{
					item.previous.next = item;
				}
			}
		}
		else if (!item.next) 
		{
			
		}
		else 
		{
			
			item.previous.next = item.next;
			item.next.previous = item.previous;
			item.previous = this.last;
			item.next = null;
			this.last = item;

			if (item.previous) 
			{
				item.previous.next = item;
			}
		}
	}

	remove(node: Node) 
	{
		const item = this.items.get(node.id);
		if (!item) 
		{
			return;
		}

		if (this.items.size === 1) 
		{
			this.first = null;
			this.last = null;
		}
		else 
		{
			if (!item.previous) 
			{
				this.first = item.next;
        this.first!.previous = null;
			}

			if (!item.next) 
			{
				this.last = item.previous;
        this.last!.next = null;
			}

			if (item.previous && item.next) 
			{
				item.previous.next = item.next;
				item.next.previous = item.previous;
			}
		}

		this.items.delete(node.id);
		this.numPoints -= node.numPoints;
	}

	getLRUItem(): Node | undefined 
	{
		return this.first ? this.first.node : undefined;
	}

	freeMemory(): void 
	{
		if (this.items.size <= 1) 
		{
			return;
		}

		while (this.numPoints > this.pointBudget * 2) 
		{
			const node = this.getLRUItem();
			if (node) 
			{
				this.disposeSubtree(node);
			}
		}
	}

	disposeSubtree(node: Node): void 
	{
		// 收集所有要移除和释放的节点和它下面所有的子节点
		const nodesToDispose: Node[] = [node];
		node.traverse((n) => 
		{
			if (n.loaded) 
			{
				nodesToDispose.push(n);
			}
		});

		// 一次释放所有节点
		for (const n of nodesToDispose) 
		{
			n.dispose();
			this.remove(n);
		}
	}
}
