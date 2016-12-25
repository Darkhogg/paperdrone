export default class Plugin {
    constructor (name, dependencies=[]) {
        this.name = name;
        this.dependencies = dependencies;
    }

    async onEnable (bot, options) {}
}
