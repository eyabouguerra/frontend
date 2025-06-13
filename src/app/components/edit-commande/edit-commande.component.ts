import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Client } from 'src/app/model/client';
import { ClientService } from 'src/app/services/client.service';
import { CommandeService } from 'src/app/services/commande.service';
import { ProduitService } from 'src/app/services/produit.service';
import { Observable, BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';

// Define the interface for CommandeProduit
interface CommandeProduit {
  id?: number;
  produit?: { id: number; nomProduit?: string; typeProduit?: { name?: string } };
  quantite?: number;
}

@Component({
  selector: 'app-edit-commande',
  templateUrl: './edit-commande.component.html',
  styleUrls: ['./edit-commande.component.css']
})
export class EditCommandeComponent implements OnInit {
  commandeForm: FormGroup;
  id!: number;
  produits: any[] = [];
  clients: Client[] = [];
  
  // BehaviorSubject pour synchroniser les données du popup
  private produitsForPopup = new BehaviorSubject<any[]>([]);
  public produitsForPopup$ = this.produitsForPopup.asObservable();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private commandeService: CommandeService,
    private produitService: ProduitService,
    private clientService: ClientService,
    private dialog: MatDialog
  ) {
    this.commandeForm = this.fb.group({
      codeCommande: ['', Validators.required],
      clientId: [null, Validators.required],
      dateCommande: ['', Validators.required],
      price: ['', Validators.required],
      commandeProduits: this.fb.array([])
    });
  }

  get commandeProduits(): FormArray {
    return this.commandeForm.get('commandeProduits') as FormArray;
  }

  ngOnInit(): void {
    this.id = +this.route.snapshot.params['id'];
    if (isNaN(this.id)) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'ID de commande invalide.',
        confirmButtonColor: '#dc3545'
      }).then(() => this.router.navigate(['/commandes']));
      return;
    }

    this.loadProduits();
    this.loadCommande();
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe(clients => {
      this.clients = clients;
    });
  }

  getClientName(clientId: number): string {
    const client = this.clients.find(c => c.clientId === clientId);
    return client ? client.fullName : 'Client inconnu';
  }

  loadCommande(): void {
    this.commandeService.getCommandeById(this.id).subscribe({
      next: (commande) => {
        this.commandeForm.patchValue({
          codeCommande: commande.codeCommande,
          dateCommande: commande.dateCommande,
          price: commande.price || 0,
          clientId: commande.client?.clientId || null
        });

        const commandeProduitsArray = this.fb.array([]);
        if (commande.commandeProduits && Array.isArray(commande.commandeProduits)) {
          commande.commandeProduits.forEach((cp: CommandeProduit) => {
            const productGroup = this.fb.group({
              nomProduit: [{ value: cp.produit?.nomProduit || '', disabled: true }],
              quantite: [cp.quantite || 1, [Validators.required, Validators.min(1)]],
              typeProduit: [{ value: cp.produit?.typeProduit?.name || '', disabled: true }],
              produitId: [cp.produit?.id || null, Validators.required]
            });
            commandeProduitsArray.push(productGroup as any);
          });
        }
        this.commandeForm.setControl('commandeProduits', commandeProduitsArray);

        this.calculateTotalPrice();
        this.updateProduitsForPopup(); // Initialiser les données du popup
      },
      error: (error) => {
        console.error('Error loading commande:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Commande introuvable.',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  loadProduits(): void {
    this.produitService.getAllProduits().subscribe({
      next: (res) => (this.produits = res),
      error: (error) => {
        console.error('Error loading produits:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les produits.',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  calculateTotalPrice(): void {
    let totalPrice = 0;
    this.commandeProduits.controls.forEach((control: any) => {
      const group = control as FormGroup;
      const produitId = group.get('produitId')?.value;
      const quantite = group.get('quantite')?.value || 0;
      const produit = this.produits.find(p => p.id === produitId);
      if (produit && quantite > 0) {
        totalPrice += produit.prix * quantite;
      }
    });
    this.commandeForm.get('price')?.setValue(totalPrice);
    
    // Mettre à jour les données du popup après recalcul
    this.updateProduitsForPopup();
  }

  // Nouvelle méthode pour mettre à jour les données du popup
  updateProduitsForPopup(): void {
    const produitsData = this.commandeProduits.controls.map((control: any) => {
      const group = control as FormGroup;
      return {
        nomProduit: group.get('nomProduit')?.value,
        quantite: group.get('quantite')?.value,
        typeProduit: group.get('typeProduit')?.value
      };
    });
    this.produitsForPopup.next(produitsData);
  }

  // Méthode appelée lors du changement de quantité
  onQuantityChange(): void {
    this.calculateTotalPrice();
  }



  private getCommandeProduitIds(): Observable<(number | undefined)[]> {
    return new Observable<(number | undefined)[]>(observer => {
      this.commandeService.getCommandeById(this.id).subscribe({
        next: (commande) => {
          const ids = commande.commandeProduits?.map((cp: CommandeProduit) => cp.id) || [];
          observer.next(ids);
          observer.complete();
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des commande_produit IDs:', error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }

  editCommande(): void {
    if (this.commandeForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir tous les champs obligatoires.',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    this.getCommandeProduitIds().subscribe({
      next: (existingCommandeProduitIds) => {
        const formValues = this.commandeForm.getRawValue();

        const commandeToUpdate = {
          id: this.id,
          codeCommande: formValues.codeCommande,
          dateCommande: formValues.dateCommande,
          price: formValues.price,
          client: formValues.clientId ? { clientId: formValues.clientId } : null,
          commandeProduits: formValues.commandeProduits.map((cp: any, index: number) => ({
            id: existingCommandeProduitIds[index],
            produit: { id: cp.produitId },
            quantite: cp.quantite
          }))
        };

        this.commandeService.updateCommande(commandeToUpdate).subscribe({
          next: (updatedCommande) => {
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Commande mise à jour avec succès !',
              confirmButtonColor: '#198754'
            }).then(() => {
              this.router.navigate(['/commandes']);
            });
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Échec de la mise à jour de la commande.',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }
}