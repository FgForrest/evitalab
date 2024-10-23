import { MenuItem } from "./MenuItem";

export class MenuSubheader<AT> implements MenuItem<AT> {
    readonly title: string;
    readonly type: string = 'subheader'

    constructor(title: string){
        this.title = title
    }
}