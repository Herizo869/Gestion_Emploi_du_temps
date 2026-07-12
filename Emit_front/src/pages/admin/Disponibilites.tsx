import { 
  useCallback, 
  useEffect, 
  useState 
} from "react";

import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock 
} from "lucide-react";


import { 
  Card, 
  CardBody, 
  CardHeader 
} from "@/components/ui/Card";


import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";


import { 
  useData 
} from "@/context/DataContext";


import { 
  apiDisposEnseignant,
  apiSaveDisponibilites,
  apiGetEdt,
  type Dispo 
} from "@/lib/api";


import type { Enseignant } from "@/types";



const CRENEAUX = [

  "07h00 - 08h00",
  "08h00 - 09h00",
  "09h00 - 10h00",
  "10h00 - 11h00",
  "11h00 - 12h00",

  "14h00 - 15h00",
  "15h00 - 16h00",
  "16h00 - 17h00",
  "17h00 - 18h00"

] as const;



const JOURS = [

  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi"

] as const;



const NB_CRENEAUX = CRENEAUX.length;
const NB_JOURS = JOURS.length;



type State = 
"dispo" | 
"indispo" | 
"vide";



type SlotEDT = {

 id:string;

 jour:string;

 heureDebut:string;

 heureFin:string;


 cours?:{

   intitule:string;

 };

};





function disposToGrid(dispos:Dispo[]):State[][] {


 const grid:State[][] = Array.from(

   {length:NB_CRENEAUX},

   ()=>Array(NB_JOURS).fill("vide")

 );


 dispos.forEach((d)=>{


   const row =
   CRENEAUX.indexOf(
    d.creneau as typeof CRENEAUX[number]
   );


   const col =
   JOURS.indexOf(
    d.jour as typeof JOURS[number]
   );



   if(row>=0 && col>=0){

     grid[row][col] =
     d.estDisponible
     ?
     "dispo"
     :
     "indispo";

   }


 });


 return grid;

}





function countHours(grid:State[][]){

 return grid
 .flat()
 .filter(v=>v==="dispo")
 .length;

}






export default function AdminDisponibilites(){


const {
 enseignants,
 semestres,
 refresh

}=useData();




const [selectedId,setSelectedId]
=
useState("");



const [semestreId,setSemestreId]
=
useState("");



const [grid,setGrid]
=
useState<State[][]>(

 Array.from(
   {length:NB_CRENEAUX},
   ()=>Array(NB_JOURS).fill("vide")
 )

);




const [saving,setSaving]
=
useState(false);



const [saved,setSaved]
=
useState(false);



const [error,setError]
=
useState<string|null>(null);



const [changed,setChanged]
=
useState(false);



const [loadingTeacher,setLoadingTeacher]
=
useState(false);



// nouveaux états pour contrôle EDT

const [creneauxPris,setCreneauxPris]
=
useState<SlotEDT[]>([]);

// Sélection automatique enseignant
useEffect(()=>{

 if(enseignants.length>0 && !selectedId)
 {
   setSelectedId(enseignants[0].id);
 }

},[
 enseignants,
 selectedId
]);




// Sélection automatique semestre
useEffect(()=>{

 if(semestres.length>0 && !semestreId)
 {

   const publie =
   [...semestres]
   .reverse()
   .find(
     s=>s.statut==="publie"
   );


   setSemestreId(
     (publie ??
     semestres[semestres.length-1])
     .id
   );

 }

},[
 semestres,
 semestreId
]);







// Chargement des disponibilités enseignant
const loadDispos =
useCallback(

async(
 enseignantId:string,
 semId:string
)=>{


 if(!enseignantId || !semId)
   return;



 setLoadingTeacher(true);

 setError(null);



 try{


   const data =
   await apiDisposEnseignant(
     enseignantId,
     semId
   );



   setGrid(

    data.length>0

    ?

    disposToGrid(data)

    :

    Array.from(
     {length:NB_CRENEAUX},
     ()=>Array(NB_JOURS).fill("vide")
    )

   );



 }

 catch(e:any){


   setError(
    e.message ??
    "Erreur chargement disponibilités"
   );


 }

 finally{

   setLoadingTeacher(false);

   setChanged(false);

 }


},

[]);






useEffect(()=>{


 loadDispos(
   selectedId,
   semestreId
 );


},[
 selectedId,
 semestreId,
 loadDispos
]);








// ======================================================
// VERIFICATION SI LE CRENEAU EST DEJA PRIS DANS L'EDT
// ======================================================


const verifierCreneauxPris =
async()=>{


 if(!selectedId || !semestreId)
   return true;



 try{

   const conflits:SlotEDT[]=[];



   for(
    let row=0;
    row<NB_CRENEAUX;
    row++
   )
   {

     for(
      let col=0;
      col<NB_JOURS;
      col++
     )
     {


       const value =
       grid[row][col];



       if(value==="vide")
         continue;




       const heure =
       CRENEAUX[row]
       .split("-")[0]
       .trim()
       .replace("h",":");



       const trouve =
       edt.find(
        slot=>

        slot.jour===JOURS[col]

        &&

        slot.heureDebut
        .substring(0,5)
        === heure.substring(0,5)

       );



       if(trouve)
       {
         conflits.push(trouve);
       }



     }

   }



   setCreneauxPris(conflits);



   return conflits.length===0;



 }

 catch(e){


   console.error(
    "Erreur vérification EDT",
    e
   );


   return true;

 }


};









// Changement cellule grille

const toggle =
(
 row:number,
 col:number

)=>{


 setGrid(prev=>{


   const copy =
   prev.map(r=>[...r]);



   copy[row][col] =

   copy[row][col]==="vide"

   ?

   "dispo"

   :

   copy[row][col]==="dispo"

   ?

   "indispo"

   :

   "vide";



   return copy;


 });



 setChanged(true);

 setSaved(false);


};








// ======================================================
// SAUVEGARDE AVEC VERIFICATION EDT
// ======================================================


const handleSave =
async()=>{


 if(!selectedId)
 {

   setError(
    "Veuillez sélectionner un enseignant"
   );

   return;

 }



 if(!semestreId)
 {

   setError(
    "Veuillez sélectionner un semestre"
   );

   return;

 }





 const libre =
 await verifierCreneauxPris();





 if(!libre)
 {

   setError(
    "Impossible : ce créneau existe déjà dans l'EDT."
   );


   return;

 }






 setSaving(true);

 setError(null);





 try{


 const disponibilites:Dispo[]=[];



 for(
  let row=0;
  row<NB_CRENEAUX;
  row++
 )
 {


   for(
    let col=0;
    col<NB_JOURS;
    col++
   )
   {


     const state =
     grid[row][col];



     if(state!=="vide")
     {


       disponibilites.push({

        jour:JOURS[col],

        creneau:CRENEAUX[row],

        estDisponible:
        state==="dispo",

        estIndisponible:
        state==="indispo"


       });


     }


   }


 }



 await apiSaveDisponibilites(

   selectedId,

   semestreId,

   disponibilites

 );



 setSaved(true);

 setChanged(false);



 await refresh();



 setTimeout(
  ()=>setSaved(false),
  3000
 );



 }

 catch(e:any)
 {


   setError(
    e.message ??
    "Erreur lors de la sauvegarde"
   );


 }

 finally{


   setSaving(false);


 }



};



const totalHours =
countHours(grid);



const current =
enseignants.find(
 e=>e.id===selectedId
);
}
