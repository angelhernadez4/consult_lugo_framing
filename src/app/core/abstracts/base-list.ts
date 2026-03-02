import { Gender } from "@core/i18n";
import { BaseCrud } from "./base-crud";
import { SuccessObs } from "@core/interfaces";

export abstract class List<T> extends BaseCrud<T> {
    public hasGetAllError(elements: any) {
        if (elements === null) {
            this.notificationService.error(`obtener listado de ${this.names.pluralName}`)
            this.redirectToIndex()
            return true;
        }

        return false;
    }

    public showConfirmDelete(name: string, deleteService: SuccessObs) {
        const article = this.names.gender === Gender.MALE ? 'the' : 'the'
        const message: string = `¿Are you sure you want to delete ${article} ${this.names.singularName} ${name}`
        this.notificationService.showConfirm({ message }, () => this.deleteElement(deleteService))
    }

    protected abstract getAll(): void;

    private deleteElement(deleteService: SuccessObs) {
        deleteService.subscribe((success) => this.handleDeleteRes(success))
    }
    private handleDeleteRes(success: boolean) {
        if (!success) {
            this.notificationService.error(`eliminar ${this.names.singularName}`)
            return
        }
        this.notificationService.success(`${this.names.singularName} eliminado`)
        this.getAll()
    }

    protected override redirectToIndex() {
        this.router.navigateByUrl(this.routes.fatherRoute)
    }
}
