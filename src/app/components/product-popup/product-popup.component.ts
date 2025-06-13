import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-popup',
  templateUrl: './product-popup.component.html',
  styleUrls: ['./product-popup.component.css']
})
export class ProductPopupComponent implements OnInit, OnDestroy {
  produits: any[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<ProductPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.produits = data.produits || [];
  }

  ngOnInit(): void {
    // S'abonner aux changements des données de produits pour mise à jour en temps réel
    if (this.data.produitsObservable) {
      this.subscription = this.data.produitsObservable.subscribe((updatedProduits: any[]) => {
        this.produits = updatedProduits;
      });
    }
  }

  ngOnDestroy(): void {
    // Se désabonner pour éviter les fuites mémoire
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}