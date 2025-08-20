import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, CreditCard } from "lucide-react";

export interface CartItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  service: string;
  serviceName: string;
  price: number;
  date?: string;
  time?: string;
  depot?: string;
}

interface CartButtonProps {
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

const CartButton = ({ cartItems, onRemoveItem, onCheckout }: CartButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
  const itemCount = cartItems.length;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <ShoppingCart className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Cart</span>
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {itemCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
              Service Cart ({itemCount} items)
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {itemCount === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.serviceName}</h4>
                            <p className="text-sm text-muted-foreground">{item.vehicleName}</p>
                            {item.date && item.time && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.date} at {item.time}
                              </p>
                            )}
                            {item.depot && (
                              <p className="text-xs text-muted-foreground">
                                Location: {item.depot}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">${item.price}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveItem(item.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Continue Shopping
                    </Button>
                    <Button onClick={onCheckout} className="bg-gradient-primary text-white border-0">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartButton;