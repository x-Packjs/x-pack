
type Option = {
    name?: string;
    parent?: Scope;
    names?: string[];
};

class Scope {
    /**
     * 作用域名称
     */
    private name: string;

    /**
     * 父级作用域
     */
    public parent: Scope;

    /**
     * 该作用域中的变量名/方法名
     */
    private names: string[];

    constructor(options: Option = {}) {
        this.name = options.name;
        this.parent = options.parent;
        this.names = options.names || [];
    }

    public add(name: string): void {
        this.names.push(name);
    }

    public findDefiningScope(name: string): Scope | null {
        if (this.names.includes(name)) {
            return this;
        }
        if (this.parent) {
            return this.parent.findDefiningScope(name);
        }
        return null;
    }
}

export default Scope;