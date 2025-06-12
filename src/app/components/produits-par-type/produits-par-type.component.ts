import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from 'src/app/services/produit.service';
import { AddProduitComponent } from '../add-produit/add-produit.component';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-produits-par-type',
  templateUrl: './produits-par-type.component.html',
  styleUrls: ['./produits-par-type.component.css']
})
export class ProduitsParTypeComponent implements OnInit {
  typeId!: number;
  typeName: string = '';
  produits: any[] = [];
  searchTerm: string = '';
  produitsFiltres: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.typeId = +params['id'];
      if (this.typeId) {
        this.loadProduits();
      } else {
        console.error('Invalid typeId:', this.typeId);
      }
    });

    // Reload data when query params change (e.g., refresh)
    this.route.queryParams.subscribe(() => {
      this.loadProduits();
    });

    this.route.queryParams.subscribe(queryParams => {
      this.typeName = queryParams['typeName'] || 'Inconnu';
    });
  }

  loadProduits(): void {
    if (this.typeId) {
      this.produitService.getProduitsByType(this.typeId).subscribe({
        next: (data) => {
          this.produits = data;
          this.produitsFiltres = [...data]; // Reset filtered list
          console.log('Produits chargés:', this.produits);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des produits:', err);
        }
      });
    }
  }

  filterProduits(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      this.produitsFiltres = this.produits.filter(p =>
        p.nomProduit.toLowerCase().includes(term) ||
        p.libelle.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.codeProduit.toString().includes(term)
      );
    } else {
      this.produitsFiltres = [...this.produits];
    }
  }

  addProduit(): void {
    const dialogRef = this.dialog.open(AddProduitComponent, {
      width: '650px',
      height: '750px',
      disableClose: false,
      data: { typeId: this.typeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProduits();
      }
    });
  }

  editProduit(produitId: number): void {
    this.router.navigate(['/editproduit', produitId], {
      queryParams: { typeName: this.typeName, typeId: this.typeId },
      queryParamsHandling: 'merge'
    });
  }

  deleteProduit(produitId: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      text: `ID du produit : ${produitId}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.produitService.deleteProduitById(produitId).subscribe(
          () => {
            this.produits = this.produits.filter(produit => produit.id !== produitId);
            this.produitsFiltres = [...this.produits]; // Update filtered list
            Swal.fire({
              title: 'Supprimé !',
              text: 'Produit supprimé avec succès.',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
          },
          (error) => {
            console.error('Erreur lors de la suppression du produit:', error);
            Swal.fire({
              title: 'Erreur !',
              text: 'Une erreur est survenue lors de la suppression du produit.',
              icon: 'error',
              confirmButtonColor: '#d33'
            });
          }
        );
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AddProduitComponent, {
      data: { typeId: this.typeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProduits();
      }
    });
  }
}