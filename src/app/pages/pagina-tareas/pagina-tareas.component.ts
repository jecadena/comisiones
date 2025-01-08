import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Tarea {
  nombre: string;
}

interface Columna {
  nombre: string;
  tareas: Tarea[];
}

@Component({
    selector: 'app-pagina-tareas',
    templateUrl: './pagina-tareas.component.html',
    styleUrls: ['./pagina-tareas.component.scss'],
    standalone: false
})
export class PaginaTareasComponent {
  columnas: Columna[] = [
    {
      nombre: 'To Do',
      tareas: [
        { nombre: 'Tarea 1' },
        { nombre: 'Tarea 2' },
        { nombre: 'Tarea 3' }
      ]
    },
    {
      nombre: 'In Progress',
      tareas: [
        { nombre: 'Tarea 4' },
        { nombre: 'Tarea 5' }
      ]
    },
    {
      nombre: 'In Review',
      tareas: [
        { nombre: 'Tarea 6' }
      ]
    },
    {
      nombre: 'Testing',
      tareas: [
        { nombre: 'Tarea 7' }
      ]
    },
    {
      nombre: 'Done',
      tareas: [
        { nombre: 'Tarea 8' }
      ]
    }
  ];

  drop(event: CdkDragDrop<Tarea[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }
}
