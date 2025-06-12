import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ProduitService } from 'src/app/services/produit.service';

@Component({
  selector: 'app-edit-produit',
  templateUrl: './edit-produit.component.html',
  styleUrls: ['./edit-produit.component.css']
})
export class EditProduitComponent implements OnInit {
  produit: any = {};
  id!: number;
  typeId!: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private pService: ProduitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = +this.activatedRoute.snapshot.params['id'];
    this.typeId = +this.activatedRoute.snapshot.queryParams['typeId'] || 0; // Get typeId from query params
    if (!this.id) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'L\'ID du produit est manquant.',
        confirmButtonText: 'OK'
      }).then(() => {
        this.router.navigate(['/produits']);
      });
      return;
    }
    this.loadProduit();
  }

  loadProduit(): void {
    this.pService.getProduitById(this.id).subscribe({
      next: (res) => {
        this.produit = { ...res };
        console.log('Produit récupéré :', this.produit);
        // Update typeId if not set and available in product
        if (!this.typeId && this.produit.typeId) {
          this.typeId = this.produit.typeId;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du produit', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de récupérer le produit.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/produits']);
        });
      }
    });
  }

  editProduit(): void {
    if (!this.produit.id) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'L\'ID du produit est manquant.',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!this.produit.nomProduit || !this.produit.prix) {
      Swal.fire({
        icon: 'warning',
        title: 'Champs manquants',
        text: 'Veuillez remplir tous les champs obligatoires (Nom et Prix).',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.pService.updateProduit(this.produit).subscribe({
      next: (res) => {
        console.log('Produit mis à jour avec succès:', res);
        this.produit = { ...res };
        const typeId = this.typeId || this.produit.typeId; // Use typeId from query or product
        if (typeId) {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Le produit a été mis à jour avec succès !',
            confirmButtonText: 'OK',
            timer: 10000,
            timerProgressBar: true
          }).then((result) => {
            if (result.isConfirmed || result.dismiss) {
              this.router.navigate(['/produits', typeId], { queryParams: { refresh: new Date().getTime() } });
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Le type du produit est manquant.',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/produits']);
          });
        }
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du produit', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la mise à jour du produit.',
          confirmButtonText: 'OK'
        });
      }
    });
  }
}